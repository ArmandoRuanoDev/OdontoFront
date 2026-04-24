import { TestBed } from '@angular/core/testing';

import { Sub } from './sub';

describe('Sub', () => {
  let service: Sub;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sub);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
