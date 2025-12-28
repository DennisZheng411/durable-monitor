
export enum StepStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ExecutionStep {
  id: string;
  name: string;
  type: 'Starter' | 'Orchestrator' | 'Activity';
  status: StepStatus;
  message: string;
  details?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface CityData {
  name: string;
  sales: number;
  status: StepStatus;
}
