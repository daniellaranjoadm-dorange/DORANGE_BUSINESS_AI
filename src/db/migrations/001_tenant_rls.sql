-- R5.3.6 - Migracao experimental.
-- Nao aplicar em producao.
-- Escopo: tabela services da fixture de testes.

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.services;

CREATE POLICY tenant_isolation
ON public.services
FOR ALL
USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')
)
WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')
);
