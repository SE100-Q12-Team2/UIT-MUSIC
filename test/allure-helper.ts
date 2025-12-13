/**
 * Allure Test Helper
 * Cung cấp các decorator và utility functions để sử dụng Allure Reporting
 */

export class AllureHelper {
  private static get allure() {
    return (global as any).allure || {
      epic: () => {},
      feature: () => {},
      story: () => {},
      severity: () => {},
      description: () => {},
      step: () => {},
      attachment: () => {},
      parameter: () => {},
      tag: () => {},
      owner: () => {},
      issue: () => {},
      tms: () => {},
    };
  }

  /**
   * Đánh dấu epic level (cấp độ cao nhất)
   * @param name Tên epic (VD: "Authentication", "User Management")
   */
  static epic(name: string): void {
    this.allure.epic(name);
  }

  /**
   * Đánh dấu feature level
   * @param name Tên feature (VD: "Login", "Registration")
   */
  static feature(name: string): void {
    this.allure.feature(name);
  }

  /**
   * Đánh dấu user story
   * @param name Tên story (VD: "User can login with email and password")
   */
  static story(name: string): void {
    this.allure.story(name);
  }

  /**
   * Đánh dấu mức độ quan trọng của test
   * @param level 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial'
   */
  static severity(level: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial'): void {
    this.allure.severity(level);
  }

  /**
   * Thêm mô tả chi tiết cho test
   * @param description Mô tả chi tiết
   */
  static description(description: string): void {
    this.allure.description(description);
  }

  /**
   * Tạo một step trong test (hiển thị từng bước thực hiện)
   * @param name Tên bước
   * @param func Function thực hiện bước đó
   */
  static async step<T>(name: string, func: () => T | Promise<T>): Promise<T> {
    if (this.allure.step) {
      return this.allure.step(name, func);
    }
    return func();
  }

  /**
   * Attach file hoặc data vào report
   * @param name Tên attachment
   * @param content Nội dung
   * @param type MIME type
   */
  static attachment(name: string, content: string | Buffer, type: string): void {
    this.allure.attachment(name, content, type);
  }

  /**
   * Thêm parameter vào test
   * @param name Tên parameter
   * @param value Giá trị
   */
  static parameter(name: string, value: any): void {
    this.allure.parameter(name, value);
  }

  /**
   * Thêm tag cho test
   * @param tags Các tags
   */
  static tag(...tags: string[]): void {
    tags.forEach(tag => this.allure.tag(tag));
  }

  /**
   * Đánh dấu owner/người chịu trách nhiệm
   * @param owner Tên owner
   */
  static owner(owner: string): void {
    this.allure.owner(owner);
  }

  /**
   * Link đến issue tracker
   * @param issueId ID của issue
   */
  static issue(issueId: string): void {
    this.allure.issue(issueId);
  }

  /**
   * Link đến test management system
   * @param tmsId ID trong TMS
   */
  static tms(tmsId: string): void {
    this.allure.tms(tmsId);
  }

  /**
   * Attach JSON data
   */
  static attachJSON(name: string, data: any): void {
    this.attachment(name, JSON.stringify(data, null, 2), 'application/json');
  }

  /**
   * Attach text
   */
  static attachText(name: string, text: string): void {
    this.attachment(name, text, 'text/plain');
  }
}

// Export singleton instance
export const allure = AllureHelper;
