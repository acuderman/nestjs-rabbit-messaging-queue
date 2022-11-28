import { RabbitMQExchangeConfig } from '@golevelup/nestjs-rabbitmq';

export interface QueueOptions {
  exchanges: RabbitMQExchangeConfig[];
  url: string;
  prefetchCount?: number;
}

export enum RPCResponseType {
  SUCCESS = 0,
  ERROR = 1,
}

interface RPCSuccessResponse<T> {
  type: RPCResponseType.SUCCESS;
  data: T;
}

interface RPCErrorResponse {
  type: RPCResponseType.ERROR;
  message: string;
}

export type RPCResponse<T> = RPCSuccessResponse<T> | RPCErrorResponse;
