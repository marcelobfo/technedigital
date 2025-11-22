import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet';
import { ChevronRight, Home, Shield, Lock, Eye, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Helmet>
        <title>Política de Privacidade | TECHNE Digital</title>
        <meta name="description" content="Política de Privacidade da TECHNE Digital em conformidade com a LGPD. Saiba como protegemos seus dados pessoais." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border/40 bg-muted/30">
          <div className="container py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-accent transition-colors flex items-center gap-1">
                <Home className="h-4 w-4" />
                {t('nav.home')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('privacy.title')}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
              <div className="flex justify-center gap-2 mb-4">
                <Badge variant="secondary" className="text-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  Conforme LGPD
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Atualizado em 22/11/{currentYear}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                {t('privacy.title')}
              </h1>
              <p className="text-muted-foreground text-lg">
                Seu compromisso conosco, nosso compromisso com sua privacidade
              </p>
            </div>

            {/* Conteúdo Legal */}
            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              
              {/* Introdução */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
                  <Shield className="h-6 w-6 text-accent" />
                  Introdução
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  A TECHNE Digital está comprometida com a proteção da sua privacidade e de seus dados pessoais. 
                  Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações, 
                  em total conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>.
                </p>
              </section>

              {/* Seção 1 - Controlador */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">1. Controlador de Dados</h2>
                <div className="bg-muted/30 border border-border/40 p-6 rounded-lg">
                  <p className="text-muted-foreground"><strong className="text-foreground">Razão Social:</strong> TECHNE Digital LTDA</p>
                  <p className="text-muted-foreground"><strong className="text-foreground">CNPJ:</strong> [Inserir CNPJ]</p>
                  <p className="text-muted-foreground"><strong className="text-foreground">Endereço:</strong> [Inserir endereço completo]</p>
                  <p className="text-muted-foreground"><strong className="text-foreground">E-mail DPO:</strong> <a href="mailto:privacidade@technedigital.com" className="text-accent hover:underline">privacidade@technedigital.com</a></p>
                  <p className="text-muted-foreground"><strong className="text-foreground">Telefone:</strong> +55 11 99999-9999</p>
                </div>
              </section>

              {/* Seção 2 - Dados Coletados */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
                  <Eye className="h-6 w-6 text-accent" />
                  2. Dados Coletados
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Coletamos os seguintes tipos de dados pessoais:
                </p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-accent pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Dados de Identificação</h3>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Nome completo</li>
                      <li>E-mail</li>
                      <li>Telefone / WhatsApp</li>
                      <li>CPF ou CNPJ (quando aplicável)</li>
                      <li>Razão social e dados da empresa (para pessoas jurídicas)</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-accent pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Dados de Navegação</h3>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Endereço IP</li>
                      <li>Tipo de navegador e dispositivo</li>
                      <li>Páginas visitadas</li>
                      <li>Data e hora de acesso</li>
                      <li>Cookies e tecnologias similares</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-accent pl-4">
                    <h3 className="font-semibold text-foreground mb-2">Dados de Uso</h3>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Formulários preenchidos</li>
                      <li>Inscrições em newsletter</li>
                      <li>Downloads de materiais</li>
                      <li>Interações com nosso conteúdo</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Seção 3 - Finalidade */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">3. Finalidade da Coleta</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos seus dados pessoais para as seguintes finalidades:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Prestar os serviços contratados</li>
                  <li>Responder a solicitações de contato e orçamentos</li>
                  <li>Enviar comunicações de marketing (apenas com consentimento)</li>
                  <li>Enviar newsletter e conteúdos relevantes (apenas para inscritos)</li>
                  <li>Analisar o desempenho do site e melhorar a experiência do usuário</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                  <li>Prevenir fraudes e garantir a segurança dos serviços</li>
                </ul>
              </section>

              {/* Seção 4 - Base Legal */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">4. Base Legal (Art. 7º da LGPD)</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  O tratamento de seus dados pessoais é fundamentado nas seguintes bases legais:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Consentimento:</strong> Para envio de newsletter e comunicações de marketing</li>
                  <li><strong className="text-foreground">Execução de contrato:</strong> Para prestação dos serviços solicitados</li>
                  <li><strong className="text-foreground">Legítimo interesse:</strong> Para análise de desempenho e segurança do site</li>
                  <li><strong className="text-foreground">Cumprimento de obrigação legal:</strong> Para atendimento a requisitos fiscais e regulatórios</li>
                </ul>
              </section>

              {/* Seção 5 - Compartilhamento */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">5. Compartilhamento de Dados</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. 
                  Podemos compartilhar dados apenas nas seguintes situações:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Provedores de serviços:</strong> Como Google Analytics, serviços de e-mail e hospedagem</li>
                  <li><strong className="text-foreground">Obrigações legais:</strong> Quando exigido por lei ou ordem judicial</li>
                  <li><strong className="text-foreground">Proteção de direitos:</strong> Para proteger nossos direitos, propriedade ou segurança</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Todos os terceiros que tratam dados em nosso nome são obrigados a proteger suas informações de acordo com esta política.
                </p>
              </section>

              {/* Seção 6 - Direitos do Titular */}
              <section className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
                  <UserCheck className="h-6 w-6 text-accent" />
                  6. Seus Direitos (Art. 18 da LGPD)
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Como titular de dados pessoais, você tem os seguintes direitos garantidos pela LGPD:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background/50 p-4 rounded-lg border border-border/40">
                    <h4 className="font-semibold text-foreground mb-2">✅ Confirmação</h4>
                    <p className="text-sm text-muted-foreground">Confirmar se tratamos seus dados</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg border border-border/40">
                    <h4 className="font-semibold text-foreground mb-2">📋 Acesso</h4>
                    <p className="text-sm text-muted-foreground">Acessar seus dados pessoais</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg border border-border/40">
                    <h4 className="font-semibold text-foreground mb-2">✏️ Correção</h4>
                    <p className="text-sm text-muted-foreground">Corrigir dados incompletos ou inexatos</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg border border-border/40">
                    <h4 className="font-semibold text-foreground mb-2">🗑️ Exclusão</h4>
                    <p className="text-sm text-muted-foreground">Solicitar a eliminação de dados</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg border border-border/40">
                    <h4 className="font-semibold text-foreground mb-2">📦 Portabilidade</h4>
                    <p className="text-sm text-muted-foreground">Receber dados em formato estruturado</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg border border-border/40">
                    <h4 className="font-semibold text-foreground mb-2">🚫 Revogação</h4>
                    <p className="text-sm text-muted-foreground">Revogar consentimento a qualquer momento</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-6">
                  Para exercer seus direitos, entre em contato conosco através do e-mail{' '}
                  <a href="mailto:privacidade@technedigital.com" className="text-accent hover:underline font-medium">
                    privacidade@technedigital.com
                  </a>
                  . Responderemos sua solicitação em até <strong className="text-foreground">15 dias úteis</strong>.
                </p>
              </section>

              {/* Seção 7 - Cookies */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">7. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência em nosso site. Os cookies são pequenos arquivos de texto 
                  armazenados no seu dispositivo que nos permitem:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Manter você conectado (cookies essenciais)</li>
                  <li>Entender como você usa nosso site (cookies analíticos)</li>
                  <li>Personalizar conteúdo (cookies de preferência)</li>
                  <li>Exibir anúncios relevantes (cookies de marketing)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Você pode gerenciar ou desabilitar cookies através das configurações do seu navegador. Note que isso pode afetar a funcionalidade do site.
                </p>
              </section>

              {/* Seção 8 - Segurança */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
                  <Lock className="h-6 w-6 text-accent" />
                  8. Segurança
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, perda, destruição ou alteração:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Criptografia SSL/TLS para transmissão de dados</li>
                  <li>Controles de acesso rigorosos</li>
                  <li>Backups regulares</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Treinamento de equipe sobre proteção de dados</li>
                </ul>
              </section>

              {/* Seção 9 - Retenção */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">9. Prazo de Armazenamento</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Mantemos seus dados pessoais pelos seguintes períodos:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Dados de clientes:</strong> Durante a vigência do contrato + 5 anos (obrigações fiscais)</li>
                  <li><strong className="text-foreground">Newsletter:</strong> Até o cancelamento da inscrição</li>
                  <li><strong className="text-foreground">Logs de acesso:</strong> 6 meses</li>
                  <li><strong className="text-foreground">Cookies analíticos:</strong> 2 anos</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Após esses períodos, os dados são anonimizados ou excluídos de forma segura.
                </p>
              </section>

              {/* Seção 10 - Transferência Internacional */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">10. Transferência Internacional de Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Alguns de nossos provedores de serviços (como Google Analytics) podem estar localizados fora do Brasil. 
                  Nesses casos, garantimos que a transferência seja realizada em conformidade com a LGPD, utilizando cláusulas contratuais padrão 
                  e garantindo níveis adequados de proteção.
                </p>
              </section>

              {/* Seção 11 - Menores */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">11. Menores de Idade</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nossos serviços não são direcionados a menores de 18 anos. Não coletamos conscientemente dados pessoais de crianças ou adolescentes. 
                  Se você é pai, mãe ou responsável e acredita que seu filho nos forneceu dados pessoais, entre em contato conosco.
                </p>
              </section>

              {/* Seção 12 - Alterações */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">12. Alterações na Política</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações significativas por e-mail 
                  ou através de aviso destacado em nosso site. Recomendamos que você revise esta política regularmente.
                </p>
              </section>

              {/* Seção 13 - Contato DPO */}
              <section className="bg-muted/30 border border-border/40 p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-foreground">13. Contato do Encarregado de Dados (DPO)</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Se você tiver dúvidas sobre esta Política de Privacidade ou desejar exercer seus direitos, entre em contato com nosso Encarregado de Dados:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong className="text-foreground">E-mail:</strong> <a href="mailto:privacidade@technedigital.com" className="text-accent hover:underline">privacidade@technedigital.com</a></p>
                  <p><strong className="text-foreground">Telefone:</strong> +55 11 99999-9999</p>
                  <p><strong className="text-foreground">Prazo de resposta:</strong> Até 15 dias úteis</p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}