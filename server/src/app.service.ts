import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService){}

  getHello(): string {
    return 'Welcome to Egypt Supply Chain Visibilty Platform.';
  };

  getPort(): number {
    return this.configService.get<number>('port') ?? 3000;
  };
};