export interface AgentDecision {
  action: 'CLICK' | 'TYPE' | 'NAVIGATE' | 'OBSERVE' | 'FINISH' | 'DATA';
  targetId?: string;
  inputValue?: string;
  reasoning: string;
  observation: string;
  confidence: number;
}

export interface InteractionLog {
  id: string;
  timestamp: number;
  stepNumber: number;
  screenshot?: string;
  decision: AgentDecision;
  status: 'PENDING' | 'SUCCESS' | 'FAILURE';
}

export interface SimElement {
  id: string;
  tag: string;
  text?: string;
  type?: string;
  placeholder?: string;
  visible: boolean;
  interactive: boolean;
  notes?: string;
}

export interface MockBrowserProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  onAction: (action: string, targetId: string, value?: string) => void;
  error?: string | null;
  lastExtractedData?: string;
  inspectScreenshot?: string | null;
}