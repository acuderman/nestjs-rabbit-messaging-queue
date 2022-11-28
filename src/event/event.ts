import { EventOptions } from './interfaces';

export class Event<T> {
  private routingKey: string;
  private version: number;
  private options: EventOptions;

  constructor(
    routingKey: string,
    version: number,
    options?: Partial<EventOptions>,
  ) {
    this.routingKey = routingKey;
    this.version = version;
    this.options = {
      isSensitive: options?.isSensitive ?? false,
    };
  }

  public getRoutingKey(): string {
    return `${this.routingKey}.v${this.version}`;
  }

  public getVersion(): number {
    return this.version;
  }

  public getOptions(): EventOptions {
    return this.options;
  }
}
