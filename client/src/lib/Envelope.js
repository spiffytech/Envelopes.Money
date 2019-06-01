export function mkEmptyEnvelope(userId) {
  return {
    id: '',
    user_id: userId,
    name: '',
    type: 'envelope',
    extra: { due: null, target: 0, interval: 'total' },
    tags: {},
  };
}

export function setId(envelope, id) {
    return {...envelope, id};
}

export function setName(envelope, name) {
    return {...envelope, name};
}

export function setTarget(envelope, target) {
    return {...envelope, extra: {...envelope.extra, target}}
}

export function setDueDate(envelope, due) {
    return {...envelope, extra: {...envelope.extra, due}}
}