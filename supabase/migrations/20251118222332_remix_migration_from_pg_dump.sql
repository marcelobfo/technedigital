--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: activity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_type AS ENUM (
    'note',
    'status_change',
    'email_sent',
    'call',
    'meeting'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'editor',
    'viewer'
);


--
-- Name: content_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.content_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: financial_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.financial_type AS ENUM (
    'income',
    'expense'
);


--
-- Name: lead_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_priority AS ENUM (
    'low',
    'medium',
    'high'
);


--
-- Name: lead_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_status AS ENUM (
    'new',
    'contacted',
    'qualified',
    'proposal_sent',
    'won',
    'lost'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'canceled'
);


--
-- Name: post_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_status AS ENUM (
    'draft',
    'published',
    'archived'
);


--
-- Name: proposal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.proposal_status AS ENUM (
    'draft',
    'sent',
    'accepted',
    'rejected'
);


--
-- Name: calculate_proposal_item_subtotal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_proposal_item_subtotal() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.subtotal := NEW.unit_price * NEW.quantity;
  RETURN NEW;
END;
$$;


--
-- Name: calculate_proposal_totals(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_proposal_totals() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_proposal_id UUID;
  v_total DECIMAL(10,2);
  v_discount DECIMAL(10,2);
BEGIN
  -- Determinar o ID da proposta
  IF TG_OP = 'DELETE' THEN
    v_proposal_id := OLD.proposal_id;
  ELSE
    v_proposal_id := NEW.proposal_id;
  END IF;

  -- Calcular total dos itens
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_total
  FROM public.proposal_items
  WHERE proposal_id = v_proposal_id;

  -- Atualizar proposta
  UPDATE public.proposals
  SET 
    total_amount = v_total,
    discount_amount = CASE 
      WHEN discount_percentage > 0 THEN v_total * (discount_percentage / 100)
      ELSE discount_amount
    END,
    final_amount = v_total - CASE 
      WHEN discount_percentage > 0 THEN v_total * (discount_percentage / 100)
      ELSE discount_amount
    END,
    updated_at = now()
  WHERE id = v_proposal_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: generate_proposal_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_proposal_number() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1
  INTO v_count
  FROM public.proposals
  WHERE proposal_number LIKE 'PROP-' || v_year || '-%';
  
  v_number := 'PROP-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
  
  RETURN v_number;
END;
$$;


--
-- Name: handle_first_user_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_first_user_admin() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- If this is the first user, make them admin
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Criar role viewer padrão (se não for o primeiro usuário)
  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, 'viewer'::app_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.id
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: set_proposal_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_proposal_number() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.proposal_number IS NULL OR NEW.proposal_number = '' THEN
    NEW.proposal_number := public.generate_proposal_number();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    cover_image text,
    category text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    author_id uuid NOT NULL,
    status public.post_status DEFAULT 'draft'::public.post_status NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    automation_enabled boolean DEFAULT true NOT NULL,
    posts_per_week integer DEFAULT 3 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: financial_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid,
    proposal_id uuid,
    type public.financial_type NOT NULL,
    category text,
    amount numeric(10,2) NOT NULL,
    date date NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    payment_method text,
    installments integer DEFAULT 1,
    installment_number integer DEFAULT 1,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity_type public.activity_type NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    message text,
    source text DEFAULT 'contact_form'::text,
    status public.lead_status DEFAULT 'new'::public.lead_status NOT NULL,
    priority public.lead_priority DEFAULT 'medium'::public.lead_priority NOT NULL,
    assigned_to uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    read boolean DEFAULT false
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    subscribed_at timestamp with time zone DEFAULT now() NOT NULL,
    unsubscribed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT newsletter_subscribers_status_check CHECK ((status = ANY (ARRAY['active'::text, 'unsubscribed'::text])))
);


--
-- Name: portfolio_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    challenge text,
    solution text,
    results text,
    cover_image text,
    gallery_images text[] DEFAULT '{}'::text[],
    technologies text[] DEFAULT '{}'::text[],
    tags text[] DEFAULT '{}'::text[],
    client_name text,
    project_url text,
    is_featured boolean DEFAULT false,
    display_order integer DEFAULT 0,
    status public.content_status DEFAULT 'active'::public.content_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: proposal_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposal_id uuid NOT NULL,
    service_name text NOT NULL,
    description text,
    unit_price numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_id uuid NOT NULL,
    proposal_number text NOT NULL,
    status public.proposal_status DEFAULT 'draft'::public.proposal_status NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0,
    discount_amount numeric(10,2) DEFAULT 0,
    final_amount numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    terms_and_conditions text,
    valid_until date,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_catalog (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    default_price numeric(10,2) NOT NULL,
    category text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    short_description text NOT NULL,
    full_description text NOT NULL,
    icon text,
    features jsonb DEFAULT '[]'::jsonb,
    is_featured boolean DEFAULT false,
    display_order integer DEFAULT 0,
    status public.content_status DEFAULT 'active'::public.content_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_name text NOT NULL,
    client_role text NOT NULL,
    client_company text,
    client_photo text,
    testimonial_text text NOT NULL,
    rating integer NOT NULL,
    is_featured boolean DEFAULT false,
    display_order integer DEFAULT 0,
    status public.content_status DEFAULT 'active'::public.content_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: blog_settings blog_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_settings
    ADD CONSTRAINT blog_settings_pkey PRIMARY KEY (id);


--
-- Name: financial_records financial_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: portfolio_projects portfolio_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_projects
    ADD CONSTRAINT portfolio_projects_pkey PRIMARY KEY (id);


--
-- Name: portfolio_projects portfolio_projects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_projects
    ADD CONSTRAINT portfolio_projects_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: proposal_items proposal_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT proposal_items_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_proposal_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_proposal_number_key UNIQUE (proposal_number);


--
-- Name: service_catalog service_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_catalog
    ADD CONSTRAINT service_catalog_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: services services_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_slug_key UNIQUE (slug);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_blog_posts_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_author ON public.blog_posts USING btree (author_id);


--
-- Name: idx_blog_posts_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug);


--
-- Name: idx_blog_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_status ON public.blog_posts USING btree (status);


--
-- Name: idx_financial_records_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_records_date ON public.financial_records USING btree (date);


--
-- Name: idx_financial_records_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_records_lead_id ON public.financial_records USING btree (lead_id);


--
-- Name: idx_financial_records_proposal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_records_proposal_id ON public.financial_records USING btree (proposal_id);


--
-- Name: idx_financial_records_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_records_type ON public.financial_records USING btree (type);


--
-- Name: idx_lead_activities_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities USING btree (lead_id);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- Name: idx_newsletter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers USING btree (email);


--
-- Name: idx_newsletter_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_status ON public.newsletter_subscribers USING btree (status);


--
-- Name: idx_portfolio_projects_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_projects_slug ON public.portfolio_projects USING btree (slug);


--
-- Name: idx_proposal_items_proposal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposal_items_proposal_id ON public.proposal_items USING btree (proposal_id);


--
-- Name: idx_proposals_lead_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_lead_id ON public.proposals USING btree (lead_id);


--
-- Name: idx_proposals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_status ON public.proposals USING btree (status);


--
-- Name: proposal_items calculate_item_subtotal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER calculate_item_subtotal BEFORE INSERT OR UPDATE ON public.proposal_items FOR EACH ROW EXECUTE FUNCTION public.calculate_proposal_item_subtotal();


--
-- Name: profiles on_first_user_admin; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_first_user_admin AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_admin();


--
-- Name: proposals set_proposal_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_proposal_number_trigger BEFORE INSERT ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.set_proposal_number();


--
-- Name: blog_posts update_blog_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_settings update_blog_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_blog_settings_updated_at BEFORE UPDATE ON public.blog_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: financial_records update_financial_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_financial_records_updated_at BEFORE UPDATE ON public.financial_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: proposal_items update_proposal_totals; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_proposal_totals AFTER INSERT OR DELETE OR UPDATE ON public.proposal_items FOR EACH ROW EXECUTE FUNCTION public.calculate_proposal_totals();


--
-- Name: proposals update_proposals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: service_catalog update_service_catalog_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: blog_settings blog_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_settings
    ADD CONSTRAINT blog_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: financial_records financial_records_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: financial_records financial_records_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_records
    ADD CONSTRAINT financial_records_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE SET NULL;


--
-- Name: lead_activities lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: lead_activities lead_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: proposal_items proposal_items_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT proposal_items_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: proposals proposals_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: portfolio_projects Active projects are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active projects are viewable by everyone" ON public.portfolio_projects FOR SELECT USING (((status = 'active'::public.content_status) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: services Active services are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active services are viewable by everyone" ON public.services FOR SELECT USING (((status = 'active'::public.content_status) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: testimonials Active testimonials are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active testimonials are viewable by everyone" ON public.testimonials FOR SELECT USING (((status = 'active'::public.content_status) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: blog_settings Admins and editors can insert blog settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can insert blog settings" ON public.blog_settings FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: blog_posts Admins and editors can insert posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can insert posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: portfolio_projects Admins and editors can manage portfolio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can manage portfolio" ON public.portfolio_projects USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: blog_settings Admins and editors can update blog settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can update blog settings" ON public.blog_settings FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: blog_posts Admins and editors can update posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can update posts" ON public.blog_posts FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: blog_settings Admins and editors can view blog settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can view blog settings" ON public.blog_settings FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: newsletter_subscribers Admins and editors can view subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and editors can view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: lead_activities Admins can create lead activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create lead activities" ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: blog_posts Admins can delete posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete posts" ON public.blog_posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: financial_records Admins can manage financial records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage financial records" ON public.financial_records TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can manage leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage leads" ON public.leads TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: proposal_items Admins can manage proposal items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage proposal items" ON public.proposal_items TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: proposals Admins can manage proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage proposals" ON public.proposals TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: service_catalog Admins can manage service catalog; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage service catalog" ON public.service_catalog TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: services Admins can manage services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage services" ON public.services TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: newsletter_subscribers Admins can manage subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: testimonials Admins can manage testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage testimonials" ON public.testimonials TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins can view all leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lead_activities Admins can view lead activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view lead activities" ON public.lead_activities FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Anyone can insert leads from contact form; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert leads from contact form" ON public.leads FOR INSERT WITH CHECK (true);


--
-- Name: newsletter_subscribers Anyone can subscribe to newsletter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);


--
-- Name: profiles Authenticated users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: blog_posts Published posts are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published posts are viewable by everyone" ON public.blog_posts FOR SELECT USING (((status = 'published'::public.post_status) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'editor'::public.app_role)));


--
-- Name: user_roles User roles are viewable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User roles are viewable by authenticated users" ON public.user_roles FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

--
-- Name: portfolio_projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: proposal_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;

--
-- Name: proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: service_catalog; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


