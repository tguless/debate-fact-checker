export type ApiKeyStatus = {
  openai: boolean;
  tavily: boolean;
  agentReady: boolean;
};

export function getApiKeyStatus(): ApiKeyStatus {
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const tavily = Boolean(process.env.TAVILY_API_KEY?.trim());

  return {
    openai,
    tavily,
    agentReady: openai && tavily,
  };
}
