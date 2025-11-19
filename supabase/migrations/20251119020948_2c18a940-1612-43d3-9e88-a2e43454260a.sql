-- Inserir os 8 serviços predefinidos na tabela services
INSERT INTO services (
  title,
  slug,
  short_description,
  full_description,
  icon,
  status,
  is_featured,
  display_order,
  features
) VALUES 
(
  'Criação de Sites e Lojas Virtuais',
  'criacao-sites-lojas-virtuais',
  'Sites responsivos e lojas virtuais otimizadas com WordPress e Elementor.',
  'Desenvolvimento completo de sites profissionais e lojas virtuais otimizadas para conversão. Utilizamos as melhores práticas de desenvolvimento web para criar experiências digitais que engajam visitantes e transformam em clientes. Nossos sites são responsivos, rápidos e otimizados para SEO desde o primeiro dia.',
  'Globe',
  'active',
  true,
  0,
  '[
    {"text": "Design responsivo e mobile-first"},
    {"text": "Otimização para SEO"},
    {"text": "Integração com redes sociais"},
    {"text": "Painel administrativo intuitivo"},
    {"text": "Integração com sistemas de pagamento"},
    {"text": "Certificado SSL incluído"}
  ]'::jsonb
),
(
  'SEO e Otimização para Google',
  'seo-otimizacao-google',
  'Posicione seu negócio no topo do Google com estratégias avançadas de SEO.',
  'Estratégias completas de SEO para aumentar a visibilidade do seu negócio nos motores de busca. Realizamos auditoria técnica, pesquisa de palavras-chave, otimização on-page e off-page, criação de conteúdo otimizado e link building. Acompanhamento mensal com relatórios detalhados de performance.',
  'Search',
  'active',
  true,
  1,
  '[
    {"text": "Auditoria técnica completa"},
    {"text": "Pesquisa avançada de palavras-chave"},
    {"text": "Otimização on-page e off-page"},
    {"text": "Estratégia de link building"},
    {"text": "Relatórios mensais de performance"},
    {"text": "Acompanhamento de rankings"}
  ]'::jsonb
),
(
  'Gestão de Tráfego Pago',
  'gestao-trafego-pago',
  'Campanhas estratégicas no Google Ads e Meta Ads para resultados rápidos.',
  'Gestão profissional de campanhas de tráfego pago no Google Ads, Facebook Ads e Instagram Ads. Criamos estratégias personalizadas focadas em ROI, com segmentação precisa, testes A/B constantes e otimização contínua. Acompanhamento diário e relatórios transparentes sobre investimento e resultados.',
  'TrendingUp',
  'active',
  true,
  2,
  '[
    {"text": "Campanhas no Google Ads"},
    {"text": "Meta Ads (Facebook e Instagram)"},
    {"text": "Segmentação avançada de público"},
    {"text": "Otimização de conversão"},
    {"text": "Análise detalhada de ROI"},
    {"text": "Remarketing estratégico"}
  ]'::jsonb
),
(
  'Design e Branding',
  'design-branding',
  'Identidade visual que comunica a essência da sua marca.',
  'Criação completa de identidade visual e branding para empresas que querem se destacar. Desenvolvemos logotipos, paletas de cores, tipografia, elementos gráficos e manual da marca. Criamos uma identidade única que reflete os valores e a personalidade do seu negócio, com aplicação em todos os materiais de comunicação.',
  'Palette',
  'active',
  false,
  3,
  '[
    {"text": "Criação de logotipo profissional"},
    {"text": "Identidade visual completa"},
    {"text": "Manual da marca detalhado"},
    {"text": "Materiais gráficos (cartões, papelaria)"},
    {"text": "Assets para redes sociais"},
    {"text": "Mockups e apresentação da marca"}
  ]'::jsonb
),
(
  'Agentes de IA e Chatbots',
  'agentes-ia-chatbots',
  'Automatize atendimentos com inteligência artificial de ponta.',
  'Desenvolvimento de chatbots inteligentes e agentes de IA para automatizar atendimento ao cliente, qualificação de leads e suporte. Integração com WhatsApp, Facebook Messenger, site e outras plataformas. Nossos bots utilizam processamento de linguagem natural para conversas humanizadas e eficientes, disponíveis 24/7.',
  'Bot',
  'active',
  false,
  4,
  '[
    {"text": "Chatbot com IA conversacional"},
    {"text": "Atendimento automatizado 24/7"},
    {"text": "Integração com WhatsApp Business"},
    {"text": "Qualificação automática de leads"},
    {"text": "Análise de conversas e sentimentos"},
    {"text": "Dashboard de métricas"}
  ]'::jsonb
),
(
  'Sistemas de Automação',
  'sistemas-automacao',
  'Otimize processos e ganhe eficiência com automação inteligente.',
  'Desenvolvimento de sistemas de automação personalizados para otimizar processos internos da sua empresa. Automatizamos tarefas repetitivas, integramos diferentes ferramentas e sistemas, criamos workflows inteligentes e dashboards para acompanhamento. Aumente a produtividade da equipe e reduza erros operacionais.',
  'Workflow',
  'active',
  false,
  5,
  '[
    {"text": "Automação de processos repetitivos"},
    {"text": "Integração entre sistemas"},
    {"text": "Workflows personalizados"},
    {"text": "Dashboards de acompanhamento"},
    {"text": "Relatórios automatizados"},
    {"text": "Notificações inteligentes"}
  ]'::jsonb
),
(
  'Marketing de Conteúdo',
  'marketing-conteudo',
  'Estratégias de conteúdo que engajam e convertem.',
  'Desenvolvimento de estratégias completas de marketing de conteúdo para atrair, engajar e converter sua audiência. Criamos blog posts otimizados para SEO, conteúdo para redes sociais, newsletters, e-books e materiais ricos. Planejamento editorial, produção de conteúdo de qualidade e distribuição estratégica em múltiplos canais.',
  'FileText',
  'active',
  false,
  6,
  '[
    {"text": "Estratégia de conteúdo personalizada"},
    {"text": "Blog posts otimizados para SEO"},
    {"text": "Gestão de redes sociais"},
    {"text": "Newsletter e e-mail marketing"},
    {"text": "Criação de e-books e materiais ricos"},
    {"text": "Calendário editorial"}
  ]'::jsonb
),
(
  'Consultoria Digital',
  'consultoria-digital',
  'Orientação especializada para transformação digital do seu negócio.',
  'Consultoria especializada para empresas que querem acelerar sua transformação digital. Realizamos auditoria completa da presença digital, análise de concorrência, identificação de oportunidades e criação de plano estratégico personalizado. Acompanhamento na implementação das estratégias com suporte contínuo e treinamento da equipe.',
  'Lightbulb',
  'active',
  false,
  7,
  '[
    {"text": "Auditoria digital completa"},
    {"text": "Plano estratégico personalizado"},
    {"text": "Análise de concorrência"},
    {"text": "Identificação de oportunidades"},
    {"text": "Treinamento de equipe"},
    {"text": "Acompanhamento mensal"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;