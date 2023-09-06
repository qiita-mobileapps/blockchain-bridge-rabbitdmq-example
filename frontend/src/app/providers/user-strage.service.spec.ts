import { TestBed } from '@angular/core/testing';

import { UserStrageService } from './user-strage.service';

describe('UserStrageService', () => {
  let service: UserStrageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserStrageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
