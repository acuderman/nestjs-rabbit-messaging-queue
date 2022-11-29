import { QueueOptions, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Decorators } from './interfaces';

export function Rpc(
  routingKey: string,
  queuePrefix: string,
  exchange: string,
  queueOptions: QueueOptions,
): Decorators {
  const fullQueueName = `${queuePrefix}-${exchange}_${routingKey}`;

  return RabbitRPC({
    exchange: exchange,
    createQueueIfNotExists: true,
    queue: fullQueueName,
    routingKey: routingKey,
    queueOptions: queueOptions
  })
}
