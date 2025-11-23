-- Atualizar property_url para incluir a barra final (conformidade com API do Google)
UPDATE google_search_console_settings
SET property_url = 'https://technedigital.com.br/'
WHERE property_url = 'https://technedigital.com.br';

-- Alterar o default da coluna para incluir a barra
ALTER TABLE google_search_console_settings 
ALTER COLUMN property_url SET DEFAULT 'https://technedigital.com.br/';