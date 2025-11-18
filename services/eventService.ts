import { EventEmitter } from 'events';

export const eventService = new EventEmitter();


export const EVENTS = {
  POST_UPDATED: 'POST_UPDATED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  POST_LIKED: 'POST_LIKED'
};