import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Decorators, RpcOptions } from './interfaces';

export function Rpc(
  routingKey: string,
  queueName: string,
  options: RpcOptions,
): Decorators {
  const rpcOptions: RpcOptions = {
    exchange: options.exchange,
    durable: options.durable ?? true
  };
  const fullQueueName = `${queueName}-${rpcOptions.exchange}_${routingKey}`;

  return RabbitRPC({
    exchange: options.exchange,
    createQueueIfNotExists: true,
    queue: fullQueueName,
    routingKey: routingKey,
    queueOptions: {
      durable: options.durable,
    }
  })
}
