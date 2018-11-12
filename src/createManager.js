const isPlainObject = require('./utils/isPlainObject')
const isValidUrl = require('./utils/isValidUrl')

function createManager(defaultConfig) {
  const subscribers = []
  let state = {}
  let config = defaultConfig
  const queueStack = []
  let isFetching = false

  const value = () => state

  const getData = () => {
    return value()
  }

  const getQueueStack = () => {
    return queueStack
  }

  const queueAction = action => {
    if (!action.type) throw new Error('action type is missing')

    if (action.type === 'external') {
      if (!action.endPoint) throw new Error('endPoint is missing')
      if (!action.method) throw new Error('method is missing')
      if (!isValidUrl(action.endPoint))
        throw new Error('endPoint is not a valid url')
    }

    queueStack.push(action)
  }

  const executeQueue = async () => {
    const queue = queueStack.splice(0, queueStack.length)
    isFetching = true

    for (let i = 0; i < queue.length; i++) {
      const q = queue[i]
      try {
        switch(q.type) {
          case 'external':
            const json = await fetchExternal(q)
            q.data = json
            break
          case 'local':
            const localState = fetchInternal(q)
            q.data = localState
            break
          default:
            break
        }
        reduce(state, q)
      } catch (error) {
        queueStack.push(q)
      }
    }

    subscribers.forEach(fn => fn(value))
    isFetching = false
  }

  const fetchExternal = async (q) => {
    const response = await fetch(q.endPoint, {
      method: q.method,
      credentials: q.credentials ? q.credentials : 'same-origin',
      headers: {
        ...q.headers
      },
      body: ['POST', 'PUT', 'DELETE', 'PATCH'].includes(q.method)
        ? JSON.stringify(q.body)
        : null
    })
    return response.json()
  }

  const fetchInternal = (q) => {

  }

  const reduce = (state, action) => {
    if (isPlainObject(action)) {
      return state
    }

    const { endPoint, type, data } = action

    // const key = structureKeys.find(k => k.indexOf(endPoint) > -1)
    // if (!key) {
    //   throw new Error('endpoint is not a part of the structure. Please update the structure.')
    // }
    const group = endPoint.split(/||/)[0]

    return {
      ...state,
      [type]: {
        [group]: {
          ...state[group],
          [endPoint]: data
        }
      }
    }
  }

  const subscribe = fn => {
    if (typeof fn !== 'function')
      throw new Error('The subscriber is not a function')
    subscribers.push(fn)
    return () => {
      const index = subscribers.indexOf(fn)
      subscribers.splice(index, 1)
    }
  }

  return {
    getData,
    queueAction,
    executeQueue,
    getQueueStack,
    subscribe
  }
}

module.exports = createManager
