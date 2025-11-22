import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet';
import { ChevronRight, Home } from 'lucide-react';

export default function TermsOfService() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Helmet>
        <title>Termos de Uso | TECHNE Digital</title>
        <meta name="description" content="Leia os Termos de Uso da TECHNE Digital. Entenda as regras de utilização dos nossos serviços de marketing digital." />
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
              <span className="text-foreground">{t('terms.title')}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                {t('terms.title')}
              </h1>
              <p className="text-muted-foreground text-lg">
                Última atualização: 22 de novembro de {currentYear}
              </p>
            </div>

            {/* Conteúdo Legal */}
            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              
              {/* Seção 1 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">1. Aceitação dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao acessar e utilizar o site technedigital.com (doravante "Site"), você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. 
                  Se você não concorda com qualquer parte destes termos, não deve usar nosso Site ou serviços.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Estes Termos de Uso se aplicam a todos os visitantes, usuários e outros que acessam ou utilizam o Site e os serviços oferecidos pela TECHNE Digital.
                </p>
              </section>

              {/* Seção 2 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">2. Descrição dos Serviços</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A TECHNE Digital é uma agência especializada em soluções digitais, oferecendo os seguintes serviços:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>SEO e Marketing Digital</li>
                  <li>Desenvolvimento de Sites e Lojas Virtuais</li>
                  <li>Design e Branding</li>
                  <li>Inteligência Artificial e Automação</li>
                  <li>Gestão de Tráfego Pago</li>
                  <li>Marketing de Conteúdo</li>
                  <li>Consultoria Digital</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Os serviços estão sujeitos a termos e condições específicos que serão acordados mediante contrato individual com cada cliente.
                </p>
              </section>

              {/* Seção 3 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">3. Obrigações do Usuário</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao utilizar nosso Site, você concorda em:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                  <li>Não utilizar o Site para fins ilegais ou não autorizados</li>
                  <li>Não tentar acessar áreas restritas do Site sem autorização</li>
                  <li>Não transmitir vírus, malware ou qualquer código malicioso</li>
                  <li>Não violar direitos de propriedade intelectual de terceiros</li>
                  <li>Respeitar os direitos de privacidade de outros usuários</li>
                </ul>
              </section>

              {/* Seção 4 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">4. Propriedade Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Todo o conteúdo presente no Site, incluindo mas não se limitando a textos, gráficos, logotipos, ícones, imagens, áudio clips, downloads digitais 
                  e compilações de dados, é propriedade da TECHNE Digital ou de seus fornecedores de conteúdo e está protegido por leis brasileiras e internacionais 
                  de direitos autorais.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  A compilação de todo o conteúdo do Site é propriedade exclusiva da TECHNE Digital e está protegida por leis de direitos autorais. 
                  É proibida a reprodução, distribuição ou uso comercial sem autorização prévia por escrito.
                </p>
              </section>

              {/* Seção 5 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">5. Limitação de Responsabilidade</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A TECHNE Digital se esforça para manter o Site atualizado e funcional, porém não garante a disponibilidade contínua ou ausência de erros. 
                  O Site e seus serviços são fornecidos "no estado em que se encontram", sem garantias de qualquer tipo.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Em nenhuma circunstância a TECHNE Digital será responsável por danos diretos, indiretos, incidentais, consequenciais ou punitivos decorrentes do 
                  uso ou incapacidade de uso do Site ou serviços.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  O Site pode conter links para sites de terceiros. A TECHNE Digital não é responsável pelo conteúdo, políticas de privacidade ou práticas 
                  de sites de terceiros.
                </p>
              </section>

              {/* Seção 6 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">6. Privacidade e Proteção de Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A coleta, uso e proteção de suas informações pessoais são regidos por nossa{' '}
                  <Link to="/privacy" className="text-accent hover:underline font-medium">
                    Política de Privacidade
                  </Link>
                  , que faz parte integrante destes Termos de Uso.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Ao utilizar nosso Site, você concorda com a coleta e uso de informações de acordo com nossa Política de Privacidade, 
                  em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>
              </section>

              {/* Seção 7 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">7. Modificações dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A TECHNE Digital reserva-se o direito de modificar estes Termos de Uso a qualquer momento, sem aviso prévio. 
                  As alterações entrarão em vigor imediatamente após sua publicação no Site.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  É responsabilidade do usuário revisar periodicamente estes Termos de Uso. O uso continuado do Site após 
                  quaisquer alterações constitui aceitação dos novos termos.
                </p>
              </section>

              {/* Seção 8 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">8. Lei Aplicável e Jurisdição</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa relacionada a estes termos 
                  será submetida à jurisdição exclusiva dos tribunais brasileiros.
                </p>
              </section>

              {/* Seção 9 */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">9. Disposições Gerais</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Se qualquer disposição destes Termos de Uso for considerada inválida ou inexequível, as demais disposições permanecerão 
                  em pleno vigor e efeito.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  A falha da TECHNE Digital em exercer ou fazer cumprir qualquer direito ou disposição destes Termos de Uso não constituirá 
                  renúncia de tal direito ou disposição.
                </p>
              </section>

              {/* Seção 10 - Contato */}
              <section className="bg-muted/30 border border-border/40 p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-foreground">10. Contato</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Se você tiver dúvidas ou preocupações sobre estes Termos de Uso, entre em contato conosco:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong className="text-foreground">TECHNE Digital LTDA</strong></p>
                  <p>E-mail: <a href="mailto:contato@technedigital.com" className="text-accent hover:underline">contato@technedigital.com</a></p>
                  <p>Telefone: +55 11 99999-9999</p>
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