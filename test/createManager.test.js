const createManager = require('../src/createManager')

describe('createManager', () => {
  beforeEach(function () {
    global.fetch = jest.fn().mockImplementation(() => {
      var p = new Promise((resolve, reject) => {
        resolve({
          ok: true,
          Id: '123',
          json: function () {
            return {
              Id: '123'
            }
          }
        });
      });

      return p;
    });
  });
  
  it('exposes public api', () => {
    const manager = createManager()
    const methods = Object.keys(manager)

    expect(methods.length).toBe(5)
    expect(methods).toContain('getData')
    expect(methods).toContain('queueAction')
    expect(methods).toContain('executeQueue')
    expect(methods).toContain('getQueueStack')
    expect(methods).toContain('subscribe')
  })

  it('throws if URL is not valid', () => {
    const manager = createManager()

    const action = {
      type: 'external',
      endPoint: 'www.googlecom',
      method: 'GET'
    }

    expect(() => manager.queueAction(action)).toThrow()
  })

  it('throws if URL has bad protocol', () => {
    const manager = createManager()

    const action = {
      type: 'external',
      endPoint: 'htps://www.googlecom',
      method: 'GET'
    }

    expect(() => manager.queueAction(action)).toThrow()
  })

  it('throws if method is missing', () => {
    const manager = createManager()

    const action = {
      type: 'external',
      endPoint: 'www.google.com'
    }

    expect(() => manager.queueAction(action)).toThrow()
  })

  it('throws if endPoint is missing', () => {
    const manager = createManager()

    const action = {
      type: 'external',
      method: 'GET'
    }

    expect(() => manager.queueAction(action)).toThrow()
  })

  it('is a valid get request', async () => {

    const manager = createManager()
    const action = {
      type: 'external',
      endPoint: 'https://api-track.herokuapp.com/swagger/v1/swagger.json',
      method: 'GET'
    }

    manager.queueAction(action)
    let data = manager.getQueueStack()
    expect(data.length).toEqual(1)

    await manager.executeQueue()
    data = manager.getQueueStack()

    expect(data.length).toEqual(0)
  })

  it('subscribe is a function', () => {
    const manager = createManager()
    const isAFunction = () => {}

    expect(manager.subscribe(isAFunction)).not.toThrow()
  })

  it('unsubscribes the given function', async () => {
    const manager = createManager()
    const listenerA = jest.fn()
    const listenerB = jest.fn()

    const action = {
      type: 'external',
      endPoint: 'https://www.google.com',
      method: 'GET'
    }

    let unsubscribeA = manager.subscribe(listenerA)
    manager.queueAction(action)
    await manager.executeQueue()
    expect(listenerA.mock.calls.length).toBe(1)
    expect(listenerB.mock.calls.length).toBe(0)

    manager.queueAction(action)
    await manager.executeQueue()
    expect(listenerA.mock.calls.length).toBe(2)
    expect(listenerB.mock.calls.length).toBe(0)

    const unsubscribeB = manager.subscribe(listenerB)
    manager.queueAction(action)
    await manager.executeQueue()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(1)

    unsubscribeA()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(1)

    manager.queueAction(action)
    await manager.executeQueue()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    unsubscribeB()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    manager.queueAction(action)
    await manager.executeQueue()
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    unsubscribeA = manager.subscribe(listenerA)
    expect(listenerA.mock.calls.length).toBe(3)
    expect(listenerB.mock.calls.length).toBe(2)

    manager.queueAction(action)
    await manager.executeQueue()
    expect(listenerA.mock.calls.length).toBe(4)
    expect(listenerB.mock.calls.length).toBe(2)

    unsubscribeA()
  })
})
