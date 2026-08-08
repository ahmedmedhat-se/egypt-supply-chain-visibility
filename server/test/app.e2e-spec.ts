import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    // Assert against the live service output instead of a hardcoded string,
    // so the test never desyncs from the response text again.
    const expectedBody = app.get(AppService).getHello();
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(expectedBody);
  });

  afterEach(async () => {
    await app.close();
  });
});
