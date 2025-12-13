import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { GoogleService } from './google.service'
import { FacebookService } from './facebook.service'
import { SendOTPBodyDTO, RegisterBodyDTO, LoginBodyDTO } from './auth.dto'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'

// Import Allure helper để sử dụng đầy đủ các tính năng
import { allure } from '../../../test/allure-helper'

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService

  const mockAuthService = {
    sendOTP: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  }

  const mockGoogleService = {
    getGoogleLink: jest.fn(),
    handleGoogleCallback: jest.fn(),
  }

  const mockFacebookService = {
    getFacebookLink: jest.fn(),
    handleFacebookCallback: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: GoogleService,
          useValue: mockGoogleService,
        },
        {
          provide: FacebookService,
          useValue: mockFacebookService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('SendOTP', () => {
    beforeAll(() => {
      allure.epic('Authentication');
      allure.feature('OTP Management');
      allure.story('Send OTP to user email');
    });

    it('Gửi mã OTP đến email người dùng để xác thực đăng ký, quên mật khẩu, đăng nhập hoặc vô hiệu hóa 2FA', async () => {
      allure.severity('critical');
      allure.description('Kiểm tra chức năng gửi OTP đến email người dùng cho các mục đích khác nhau');
      allure.tag('otp', 'email', 'verification');
      
      // Arrange
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'test@example.com',
        type: TypeOfVerificationCode.REGISTER,
      }

      const expectedResult = {
        message: 'OTP code sent successfully',
      }

      await allure.step('Chuẩn bị test data và mock service', async () => {
        allure.parameter('Email', sendOTPDto.email);
        allure.parameter('Type', sendOTPDto.type);
        allure.attachJSON('Request DTO', sendOTPDto);
        mockAuthService.sendOTP.mockResolvedValue(expectedResult)
      });

      // Act
      let result: any;
      await allure.step('Gọi controller.sendOTP', async () => {
        result = await controller.sendOTP(sendOTPDto)
        allure.attachJSON('Response', result);
      });

      // Assert
      await allure.step('Verify kết quả', async () => {
        expect(authService.sendOTP).toHaveBeenCalledWith(sendOTPDto)
        expect(authService.sendOTP).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
        allure.attachText('Verification', `Service called: 1 time\nResult matches expected`);
      });
    })

    it('Nên gửi OTP cho forgot password', async () => {
      allure.severity('critical');
      
      // Arrange
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'test@example.com',
        type: TypeOfVerificationCode.FORGOT_PASSWORD,
      }

      const expectedResult = {
        message: 'OTP code sent successfully',
      }

      mockAuthService.sendOTP.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.sendOTP(sendOTPDto)

      // Assert
      expect(authService.sendOTP).toHaveBeenCalledWith(sendOTPDto)
      expect(result).toEqual(expectedResult)
    })

    it('Nên throw exception khi email không hợp lệ', async () => {
      allure.severity('critical');
      allure.description('Kiểm tra xử lý lỗi khi email không hợp lệ');
      allure.tag('otp', 'validation', 'error');
      
      // Arrange
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'invalid-email',
        type: TypeOfVerificationCode.REGISTER,
      }

      await allure.step('Mock service throw error', async () => {
        allure.parameter('Invalid Email', sendOTPDto.email);
        mockAuthService.sendOTP.mockRejectedValue(
          new Error('Invalid email format')
        )
      });

      // Act & Assert
      await allure.step('Verify exception được throw', async () => {
        await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow(
          'Invalid email format'
        )
        expect(authService.sendOTP).toHaveBeenCalledWith(sendOTPDto)
        allure.attachText('Error Message', 'Invalid email format');
      });
    })

    it('Nên throw exception khi email đã tồn tại (REGISTER)', async () => {
      // Arrange
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'existing@example.com',
        type: TypeOfVerificationCode.REGISTER,
      }

      mockAuthService.sendOTP.mockRejectedValue(
        new Error('Email already exists')
      )

      // Act & Assert
      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow(
        'Email already exists'
      )
    })

    it('Nên throw exception khi email không tồn tại (FORGOT_PASSWORD)', async () => {
      // Arrange
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'notfound@example.com',
        type: TypeOfVerificationCode.FORGOT_PASSWORD,
      }

      mockAuthService.sendOTP.mockRejectedValue(
        new Error('Email does not exist')
      )

      // Act & Assert
      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow(
        'Email does not exist'
      )
    })

    it('Nên throw exception khi thiếu email', async () => {
      // Arrange
      const sendOTPDto: any = {
        type: TypeOfVerificationCode.REGISTER,
      }
      mockAuthService.sendOTP.mockRejectedValue(new Error('Email is required'))
      // Act & Assert
      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow('Email is required')
    })

    it('Nên throw exception khi thiếu type', async () => {
      // Arrange
      const sendOTPDto: any = {
        email: 'test@example.com',
      }
      mockAuthService.sendOTP.mockRejectedValue(new Error('Type is required'))
      // Act & Assert
      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow('Type is required')
    })

    it('Nên throw exception khi type không hợp lệ', async () => {
      // Arrange
      const sendOTPDto: any = {
        email: 'test@example.com',
        type: 'INVALID_TYPE',
      }
      mockAuthService.sendOTP.mockRejectedValue(new Error('Invalid type'))
      // Act & Assert
      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow('Invalid type')
    })

    it('❌ Demo failure - Email phải chứa ký tự @', async () => {
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'noatsignemail',
        type: TypeOfVerificationCode.REGISTER,
      }
      // This will fail intentionally
      expect(sendOTPDto.email).toContain('@');
    })
  })

  describe('Register', () => {
    beforeAll(() => {
      allure.feature('User Registration');
      allure.story('Register new user account');
    });

    it('Đăng ký tài khoản người dùng mới với email, mật khẩu và xác thực OTP', async () => {
      allure.severity('blocker');
      allure.description('Kiểm tra flow đăng ký tài khoản mới hoàn chỉnh');
      allure.tag('registration', 'auth', 'happy-path');
      
      // Arrange
      const registerDto: RegisterBodyDTO = {
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
        fullName: 'New User',
        code: '123456',
      }

      const expectedResult = {
        id: 1,
        email: 'newuser@example.com',
        fullName: 'New User',
        roleId: 2,
        accountStatus: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        dateOfBirth: null,
        profilePicture: null,
        bio: null,
        country: null,
      }

      await allure.step('Setup test data và mock', async () => {
        allure.parameter('Email', registerDto.email);
        allure.parameter('Full Name', registerDto.fullName);
        allure.attachJSON('Registration Data', registerDto);
        mockAuthService.register.mockResolvedValue(expectedResult)
      });

      // Act
      let result: any;
      await allure.step('Call register API', async () => {
        result = await controller.register(registerDto)
        allure.attachJSON('User Created', result);
      });

      // Assert
      await allure.step('Verify registration success', async () => {
        expect(authService.register).toHaveBeenCalledWith(registerDto)
        expect(authService.register).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
        expect(result).not.toHaveProperty('password')
        allure.attachText('Assertions', 
          `- Service called: ✓\n- Result matches: ✓\n- Password excluded: ✓`
        );
      });
    })

    it('Nên throw exception khi mật khẩu không khớp', async () => {
      // Arrange
      const registerDto: RegisterBodyDTO = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        fullName: 'Test User',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new Error('Passwords do not match')
      )

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(
        'Passwords do not match'
      )
    })

    it('Nên throw exception khi OTP không hợp lệ', async () => {
      // Arrange
      const registerDto: RegisterBodyDTO = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
        code: 'wrong-otp',
      }

      mockAuthService.register.mockRejectedValue(new Error('Error.InvalidOTP'))

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(
        'Error.InvalidOTP'
      )
    })

    it('Nên throw exception khi OTP đã hết hạn', async () => {
      // Arrange
      const registerDto: RegisterBodyDTO = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new Error('Mã OTP đã hết hạn')
      )

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(
        'Mã OTP đã hết hạn'
      )
    })

    it('Nên throw exception khi email đã tồn tại', async () => {
      // Arrange
      const registerDto: RegisterBodyDTO = {
        email: 'existing@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new Error('Email already exists')
      )

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(
        'Email already exists'
      )
    })

    it('Nên throw exception khi thiếu email', async () => {
      const registerDto: any = {
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
        code: '123456',
      }
      mockAuthService.register.mockRejectedValue(new Error('Email is required'))
      await expect(controller.register(registerDto)).rejects.toThrow('Email is required')
    })

    it('Nên throw exception khi thiếu password', async () => {
      const registerDto: any = {
        email: 'test@example.com',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
        code: '123456',
      }
      mockAuthService.register.mockRejectedValue(new Error('Password is required'))
      await expect(controller.register(registerDto)).rejects.toThrow('Password is required')
    })

    it('Nên throw exception khi thiếu code', async () => {
      const registerDto: any = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
      }
      mockAuthService.register.mockRejectedValue(new Error('OTP code is required'))
      await expect(controller.register(registerDto)).rejects.toThrow('OTP code is required')
    })

    it('Nên throw exception khi email sai định dạng', async () => {
      const registerDto: RegisterBodyDTO = {
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        fullName: 'Test User',
        code: '123456',
      }
      mockAuthService.register.mockRejectedValue(new Error('Invalid email format'))
      await expect(controller.register(registerDto)).rejects.toThrow('Invalid email format')
    })

    it('Nên throw exception khi password yếu', async () => {
      const registerDto: RegisterBodyDTO = {
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123',
        fullName: 'Test User',
        code: '123456',
      }
      mockAuthService.register.mockRejectedValue(new Error('Password is too weak'))
      await expect(controller.register(registerDto)).rejects.toThrow('Password is too weak')
    })

    it('❌ Demo failure - Password phải dài hơn 20 ký tự', async () => {
      const registerDto: RegisterBodyDTO = {
        email: 'user@example.com',
        password: 'short',
        confirmPassword: 'short',
        fullName: 'Demo User',
        code: '123456',
      }
      // This will fail intentionally
      expect(registerDto.password.length).toBeGreaterThan(20);
    })
  })

  describe('Login', () => {
    it('Đăng nhập người dùng với email và mật khẩu, trả về access token và refresh token', async () => {
      // Arrange
      const loginDto: LoginBodyDTO = {
        email: 'user@example.com',
        password: 'Password123!',
      }

      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      const userIp = '192.168.1.1'

      const expectedResult = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }

      mockAuthService.login.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.login(loginDto, userAgent, userIp)

      // Assert
      expect(authService.login).toHaveBeenCalledWith({
        ...loginDto,
        userAgent,
        ip: userIp,
      })
      expect(authService.login).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedResult)
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('Nên throw exception khi email không tồn tại', async () => {
      // Arrange
      const loginDto: LoginBodyDTO = {
        email: 'notfound@example.com',
        password: 'Password123!',
      }

      mockAuthService.login.mockRejectedValue(
        new Error('Email does not exist')
      )

      // Act & Assert
      await expect(
        controller.login(loginDto, 'user-agent', '127.0.0.1')
      ).rejects.toThrow('Email does not exist')
    })

    it('Nên throw exception khi mật khẩu không đúng', async () => {
      // Arrange
      const loginDto: LoginBodyDTO = {
        email: 'user@example.com',
        password: 'WrongPassword',
      }

      mockAuthService.login.mockRejectedValue(
        new Error('Password is not correct')
      )

      // Act & Assert
      await expect(
        controller.login(loginDto, 'user-agent', '127.0.0.1')
      ).rejects.toThrow('Password is not correct')
    })

    it('Nên lưu thông tin device khi đăng nhập thành công', async () => {
      // Arrange
      const loginDto: LoginBodyDTO = {
        email: 'user@example.com',
        password: 'Password123!',
      }

      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)'
      const userIp = '203.0.113.1'

      const expectedResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      mockAuthService.login.mockResolvedValue(expectedResult)

      // Act
      await controller.login(loginDto, userAgent, userIp)

      // Assert
      expect(authService.login).toHaveBeenCalledWith({
        email: loginDto.email,
        password: loginDto.password,
        userAgent,
        ip: userIp,
      })
    })

    it('Nên throw exception khi tài khoản bị vô hiệu hóa', async () => {
      // Arrange
      const loginDto: LoginBodyDTO = {
        email: 'disabled@example.com',
        password: 'Password123!',
      }

      mockAuthService.login.mockRejectedValue(
        new Error('Account is inactive')
      )

      // Act & Assert
      await expect(
        controller.login(loginDto, 'user-agent', '127.0.0.1')
      ).rejects.toThrow('Account is inactive')
    })

    it('❌ Demo test failure - Invalid password format', async () => {
      allure.severity('normal');
      allure.description('Test case minh họa failure - password không đúng format');
      allure.tag('demo-failure', 'validation');

      const loginDto: LoginBodyDTO = {
        email: 'test@example.com',
        password: '123', // Invalid password
      }

      await allure.step('Gọi login với password không hợp lệ', async () => {
        allure.attachJSON('Login DTO', loginDto);
        // This will fail intentionally
        expect(loginDto.password.length).toBeGreaterThanOrEqual(8);
      });
    })
    it('Nên throw exception khi thiếu email', async () => {
      const loginDto: any = {
        password: 'Password123!',
      }
      mockAuthService.login.mockRejectedValue(new Error('Email is required'))
      await expect(controller.login(loginDto, 'user-agent', '127.0.0.1')).rejects.toThrow('Email is required')
    })

    it('Nên throw exception khi thiếu password', async () => {
      const loginDto: any = {
        email: 'user@example.com',
      }
      mockAuthService.login.mockRejectedValue(new Error('Password is required'))
      await expect(controller.login(loginDto, 'user-agent', '127.0.0.1')).rejects.toThrow('Password is required')
    })

    it('Nên throw exception khi email sai định dạng', async () => {
      const loginDto: LoginBodyDTO = {
        email: 'invalid-email',
        password: 'Password123!',
      }
      mockAuthService.login.mockRejectedValue(new Error('Invalid email format'))
      await expect(controller.login(loginDto, 'user-agent', '127.0.0.1')).rejects.toThrow('Invalid email format')
    })

    it('Nên throw exception khi password quá ngắn', async () => {
      const loginDto: LoginBodyDTO = {
        email: 'user@example.com',
        password: '123',
      }
      mockAuthService.login.mockRejectedValue(new Error('Password is too short'))
      await expect(controller.login(loginDto, 'user-agent', '127.0.0.1')).rejects.toThrow('Password is too short')
    })

    it('❌ Demo failure - AccessToken phải là chuỗi rỗng', async () => {
      const loginDto: LoginBodyDTO = {
        email: 'user@example.com',
        password: 'Password123!',
      }
      const userAgent = 'demo-agent';
      const userIp = '127.0.0.1';
      mockAuthService.login.mockResolvedValue({ accessToken: 'not-empty', refreshToken: 'token' });
      const result = await controller.login(loginDto, userAgent, userIp);
      // This will fail intentionally
      expect(result.accessToken).toBe('');
    })
  })
})
