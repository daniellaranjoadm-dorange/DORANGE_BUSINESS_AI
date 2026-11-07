/**
 * Utilitário de Consulta de Endereço por CEP (ViaCEP)
 * Tratamento seguro de rede, timeout, CEP inexistente e preenchimento manual resiliente.
 * Não envia nenhum dado pessoal (CPF, CNPJ, telefone, e-mail ou senha).
 */

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean | string;
}

export interface AddressFromCep {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function fetchAddressByCEP(
  cep: string,
  timeoutMs: number = 5000
): Promise<{ success: boolean; data?: AddressFromCep; error?: string }> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) {
    return { success: false, error: 'O CEP deve conter exatamente 8 dígitos.' };
  }

  // Rejeita sequências conhecidas de dígitos idênticos
  if (/^(\d)\1{7}$/.test(clean)) {
    return { success: false, error: 'CEP inválido.' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        error: `Serviço de CEP indisponível (${response.status}). Preencha os campos de endereço manualmente.`,
      };
    }

    const data: ViaCepResponse = await response.json();
    if (data.erro === true || data.erro === 'true') {
      return {
        success: false,
        error: 'CEP não localizado na base nacional dos Correios. Verifique o número ou preencha manualmente.',
      };
    }

    return {
      success: true,
      data: {
        cep: data.cep || `${clean.slice(0, 5)}-${clean.slice(5)}`,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: (data.uf || '').toUpperCase(),
      },
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Tempo limite ao consultar o CEP. Você pode preencher o endereço manualmente sem restrições.',
      };
    }
    return {
      success: false,
      error: 'Falha de conexão com o serviço de CEP. Preencha os campos abaixo manualmente.',
    };
  }
}
