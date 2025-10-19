import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ConfettiAction = 'shoot' | 'burst' | 'party';
export interface ConfettiEvent {
  action: ConfettiAction;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ConfettiService {
  private events$ = new Subject<ConfettiEvent>();

  onEvent() {
    return this.events$.asObservable();
  }

  trigger(event: ConfettiEvent) {
    this.events$.next(event);
  }
}
