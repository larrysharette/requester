'use strict'

const createManager = require('../src/createManager')

describe('createManager', () => {
  it('exposes public api', () => {
    const manager = createManager()
    const methods = Object.keys(manager)

    expect(methods.length).toBe(4)
    expect(methods).toContain('getData')
    expect(methods).toContain('actionUrl')
    expect(methods).toContain('actionLocal')
    expect(methods).toContain('subscribe')
  })

  it('throws if URL is not valid', () => {
    const manager = createManager()

    expect(manager.actionUrl(1)).toThrow()
    expect(manager.actionUrl({})).toThrow()
    expect(manager.actionUrl([])).toThrow()
    expect(manager.actionUrl(() => {})).toThrow()

    expect(manager.actionUrl('www.googlecom')).toThrow()
    expect(manager.actionUrl('httosj://www.googlecom')).toThrow()

    expect(manager.actionUrl('www.google.com')).not.toThrow()
  })

  it('is a valid get request', async () => {
    const manager = createManager()
    await manager.actionUrl('www.google.com', 'GET')
    const data = manager.getData()

    expect(data).toEqual({
      api: {
        crews: {
          getCrewBuilder: {
            crewList: []
          }
        }
      }
    })
  })
})
