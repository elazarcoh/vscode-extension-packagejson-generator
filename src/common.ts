export class InvalidProperty extends Error {
  constructor(propertyName?: string, message?: string) {
    super(message || `property ${propertyName} is invalid or not defined`);
  }
}
