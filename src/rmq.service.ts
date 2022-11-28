import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import {
  AmqpConnection,
  RabbitHandlerConfig,
  RequestOptions,
} from '@golevelup/nestjs-rabbitmq';
import { ChannelWrapper } from 'amqp-connection-manager';
import { RmqExchangeUtil } from './rmq-exchange.util';
import { Options } from 'amqplib';
import { RPCResponse } from './rmq.interfaces';
import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { RABBIT_RETRY_HANDLER } from './decorators';
import { Event } from './event';

@Injectable()
export class RmqService implements OnApplicationBootstrap {
  constructor(
    private amqpConnection: AmqpConnection,
    private discover: DiscoveryService,
  ) {}

  public publishEvent<T extends object>(
    event: Event<T>,
    message: T,
    exchange: string,
    options?: Options.Publish,
  ): void {
    this.amqpConnection.publish(exchange, event.getRoutingKey(), message, options);
  }

  public async request<K = object, T extends object = object>(
    routingKey: string,
    payload: T = {} as T,
    exchange: string,
    options?: RequestOptions,
  ): Promise<RPCResponse<K>> {
    return this.amqpConnection.request<RPCResponse<K>>({
      exchange,
      routingKey,
      payload: payload,
      timeout: 10_000,
      ...options,
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    const retryHandlers = [
      ...(await this.discover.providerMethodsWithMetaAtKey<RabbitHandlerConfig>(
        RABBIT_RETRY_HANDLER,
      )),
      ...(await this.discover.controllerMethodsWithMetaAtKey<RabbitHandlerConfig>(
        RABBIT_RETRY_HANDLER,
      )),
    ];

    if (retryHandlers.length === 0) {
      return
    }

    await this.amqpConnection.managedChannel.addSetup(
      async (channel: ChannelWrapper) => {
        Logger.log('Retry and dead letter queue setup started...');

        await Promise.all(
          retryHandlers.map(async ({ discoveredMethod, meta }) => {
            const handler = discoveredMethod.handler.bind(
              discoveredMethod.parentClass.instance,
            );
            await this.amqpConnection.createSubscriber(
              handler,
              meta,
              discoveredMethod.methodName,
            );

            await this.createDeadLetterQueue(channel, meta);
          }),
        );
      },
    );
  }

  private async createDeadLetterQueue(
    channel: ChannelWrapper,
    meta: RabbitHandlerConfig,
  ): Promise<void> {
    if (meta.queue === undefined || meta.queueOptions === undefined) {
      Logger.error(
        'Invalid queue configuration. queue or queueOptions are missing. Dead letter queues are not initialized',
      );
      return;
    }

    const { queue } = await channel.assertQueue(
      RmqExchangeUtil.getDeadLetterQueueName(meta.queue),
      {
        durable: true,
      },
    );
    await channel.bindQueue(
      queue,
      meta.queueOptions.arguments['x-dead-letter-exchange'],
      meta.queueOptions.arguments['x-dead-letter-routing-key'],
    );

    Logger.log({
      message: 'Dead letter queue initialized',
      queue: meta.queue,
      exchange: meta.queueOptions.arguments['x-dead-letter-exchange'],
      routingKey: meta.queueOptions.arguments['x-dead-letter-routing-key'],
    });
  }
}
