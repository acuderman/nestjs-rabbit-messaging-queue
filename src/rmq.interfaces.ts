import { RabbitMQConfig, RabbitMQExchangeConfig } from '@golevelup/nestjs-rabbitmq';

export interface RabbitMQModuleConfig extends RabbitMQConfig {
    exchanges: RabbitMQExchange[]
}

export interface RabbitMQExchange extends RabbitMQExchangeConfig {
    initRetryExchange?: boolean,
    initDeadLetterExchange?: boolean,
}