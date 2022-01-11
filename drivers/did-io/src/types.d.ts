type Driver = {};

declare module '@digitalbazaar/did-io';
declare module '@digitalbazaar/did-method-key';

declare module 'did-io' {
  function use(methodName: string, driver: Driver): void;
  function register(options: any): any;
  function get(options: any): any;

  export = {
    use,
    register,
    get,
  };
}

declare module 'did-method-key' {
  function driver(): Driver;

  export = {
    driver,
  };
}
