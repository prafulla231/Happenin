import { TestBed } from '@angular/core/testing';

import { ApprovalService } from './approval';

describe('Approval', () => {
  let service: ApprovalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApprovalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
