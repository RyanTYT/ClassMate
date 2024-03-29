// src/tests/setupTests.ts
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
});
