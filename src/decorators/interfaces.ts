// eslint-disable-next-line @typescript-eslint/ban-types
export type Decorators = <TFunction extends Function, Y>(
  target: object | TFunction,
  propertyKey?: string | symbol,
  descriptor?: TypedPropertyDescriptor<Y>,
) => void;

export interface SubscriptionOptions {
  requeueOnError?: RequeueOnErrorOptions;
  exchange: string;
  autoDelete?: boolean;
  durable?: boolean
}

export interface RequeueOnErrorOptions {
  enabled?: boolean,
  initialDelayInMs?: number,
  maxRetries?: number,
  backoffMultiplier?: number
}

export interface SubscriptionOptionsWithDefaults extends Required<SubscriptionOptions>{
  requeueOnError: Required<RequeueOnErrorOptions>
}

export interface RpcOptions {
  exchange: string;
  durable?: boolean
}