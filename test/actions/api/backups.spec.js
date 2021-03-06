import sinon from 'sinon';
import { expect } from 'chai';
import {
  fetchBackups,
  fetchBackup,
  enableBackup,
  cancelBackup,
  takeBackup,
  restoreBackup,
} from '~/actions/api/backups';
import { UPDATE_LINODE, UPDATE_BACKUP, UPDATE_BACKUPS } from '~/actions/api/linodes';
import * as fetch from '~/fetch';
import { testLinode } from '~/../test/data';

describe('actions/api/backups', async () => {
  const auth = { token: 'token' };

  const sandbox = sinon.sandbox.create();

  afterEach(() => {
    sandbox.restore();
  });

  const getGetState = (state = {}) => sandbox.stub().returns({
    authentication: auth,
    ...state,
  });
  const getDispatch = () => sandbox.spy();
  const getFetchStub = (rsp) => sandbox.stub(fetch, 'fetch').returns({ json() { return rsp; } });
  const mockResponse = {
    backups: [
      { id: 'backup_1' },
      { id: 'backup_2' },
    ],
    total_pages: 3,
    total_results: 25 * 3 - 4,
    page: 1,
  };

  it('should fetch backups', async () => {
    const dispatch = getDispatch();
    const fetchStub = getFetchStub(mockResponse);
    const getState = getGetState({
      api: {
        linodes: {
          linodes: {
            linode_1: { _backups: { backups: { }, totalPages: -1 } },
          },
        },
      },
    });

    const f = fetchBackups(0, 'linode_1');
    await f(dispatch, getState);

    expect(fetchStub.calledWith(
      auth.token, '/linodes/linode_1/backups?page=1')).to.equal(true);
    expect(dispatch.calledWith({
      type: UPDATE_BACKUPS,
      linodes: 'linode_1',
      response: mockResponse,
    })).to.equal(true);
  });

  it('should fetch backup', async () => {
    const dispatch = getDispatch();
    const fetchStub = getFetchStub(mockResponse.backups[0]);
    const getState = getGetState({
      api: {
        linodes: {
          linodes: {
            linode_1: { _backups: { backups: { }, totalPages: -1 } },
          },
        },
      },
    });

    const f = fetchBackup('linode_1', 'backup_1');

    await f(dispatch, getState);

    expect(fetchStub.calledWith(
      auth.token, '/linodes/linode_1/backups/backup_1')).to.equal(true);
    expect(dispatch.calledWith({
      type: UPDATE_BACKUP,
      linodes: 'linode_1',
      backup: mockResponse.backups[0],
      backups: 'backup_1',
    })).to.equal(true);
  });

  it('should enable backups', async () => {
    const dispatch = getDispatch();
    const getState = getGetState();
    const fetchStub = getFetchStub(mockResponse.backups[0]);
    const f = enableBackup('foo_1');

    await f(dispatch, getState);

    expect(fetchStub.calledWith(
      auth.token, '/linodes/foo_1/backups/enable', { method: 'POST' })).to.equal(true);
    expect(dispatch.calledWith({
      type: UPDATE_LINODE,
      linode: { id: 'backup_1' },
    })).to.equal(true);
  });

  it('should cancel backups', async () => {
    const dispatch = getDispatch();
    const getState = getGetState();
    const fetchStub = getFetchStub(mockResponse.backups[0]);
    const f = cancelBackup('foo_1');

    await f(dispatch, getState);

    expect(fetchStub.calledWith(
      auth.token, '/linodes/foo_1/backups/cancel', { method: 'POST' })).to.equal(true);
    expect(dispatch.calledWith({
      type: UPDATE_LINODE,
      linode: { id: 'backup_1' },
    })).to.equal(true);
  });

  const takeBackupResponse = {
    type: 'snapshot',
    created: '2016-07-25T16:59:32',
    datacenter: {
      label: 'Newark, NJ',
      datacenter: 'newark',
      id: 'newark',
    },
    updated: '2016-07-25T16:59:32',
    finished: null,
    status: 'pending',
    id: 'backup_123',
    label: '',
  };

  it('should take a backup', async () => {
    const dispatch = getDispatch();
    const getState = getGetState();
    const fetchStub = getFetchStub(takeBackupResponse);
    const f = takeBackup('linode_1');

    await f(dispatch, getState);

    expect(fetchStub.calledWith(
      auth.token, '/linodes/linode_1/backups',
      { method: 'POST' })).to.equal(true);
    expect(dispatch.calledWith({
      type: UPDATE_BACKUP,
      linodes: 'linode_1',
      backup: takeBackupResponse,
    })).to.equal(true);
  });

  describe('restoreBackup', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
      sandbox.restore();
    });

    const state = {
      authentication: { token: 'token' },
      api: {
        linodes: {
          linodes: { [testLinode.id]: testLinode },
        },
      },
    };

    it('returns a function', () => {
      const func = restoreBackup('linode_1234', 'linode_1235', 'backup_1234');
      expect(func).to.be.a('function');
    });

    it('performs the HTTP request', async () => {
      const fetchStub = sandbox.stub(fetch, 'fetch')
        .returns({ json: () => 'asdf' });
      const getState = sinon.stub().returns(state);
      const dispatch = sinon.spy();
      const func = restoreBackup('linode_1234', 'linode_1235', 'backup_1234');
      expect(await func(dispatch, getState)).to.equal('asdf');
      expect(dispatch.callCount).to.equal(0);
      expect(fetchStub.calledOnce).to.equal(true);
      expect(fetchStub.calledWith(state.authentication.token,
        '/linodes/linode_1234/backups/backup_1234/restore'));
      const data = fetchStub.firstCall.args[2];
      expect(data.method).to.equal('POST');
      expect(JSON.parse(data.body)).to.deep.equal({
        linode: 'linode_1235',
        overwrite: false,
      });
    });
  });
});
