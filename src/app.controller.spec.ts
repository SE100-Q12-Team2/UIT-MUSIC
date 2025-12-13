import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { allure } from '../test/allure-helper';

describe('AppController', () => {
  let appController: AppController;

  beforeAll(() => {
    allure.epic('Application');
    allure.feature('App Controller');
    allure.owner('Backend Team');
  });

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    beforeAll(() => {
      allure.story('Health Check Endpoint');
    });

    it('✅ should return "Hello World!" - SUCCESS', async () => {
      allure.severity('blocker');
      allure.description('Kiểm tra endpoint root trả về message chính xác');
      allure.tag('health-check', 'success');

      await allure.step('Gọi getHello() method', async () => {
        const result = appController.getHello();
        allure.attachJSON('Response', { message: result });
        expect(result).toBe('Hello World!');
      });
    });

    it('✅ should have AppController defined - SUCCESS', async () => {
      allure.severity('critical');
      allure.description('Kiểm tra AppController được khởi tạo thành công');
      allure.tag('initialization', 'success');

      await allure.step('Kiểm tra controller tồn tại', async () => {
        expect(appController).toBeDefined();
        allure.attachJSON('Controller', { defined: true });
      });
    });

    it('❌ should fail when expecting wrong message - FAILURE', async () => {
      allure.severity('normal');
      allure.description('Test case minh họa failure - mong đợi sai message');
      allure.tag('demo-failure', 'failure');

      await allure.step('Gọi getHello() với kỳ vọng sai', async () => {
        const result = appController.getHello();
        allure.attachJSON('Expected vs Actual', { 
          expected: 'Wrong Message',
          actual: result 
        });
        // This will fail intentionally for demo
        expect(result).toBe('Wrong Message');
      });
    });
  });
});
