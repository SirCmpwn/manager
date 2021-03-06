import { expect } from 'chai';
import deepFreeze from 'deep-freeze';
import { index } from '~/linodes/reducers';
import * as actions from '~/linodes/actions';

describe('linodes/index reducer', () => {
  it('should handle initial state', () => {
    expect(
      index(undefined, {})
    ).to.be.eql({ view: 'grid', selected: { } });
  });

  it('should no-op on arbitrary actions', () => {
    const state = { view: 'grid', selected: { } };
    deepFreeze(state);

    expect(index(state, { type: 'foobar' }))
      .to.deep.equal(state);
  });

  it('should handle CHANGE_VIEW', () => {
    const state = { view: 'grid', selected: { } };
    deepFreeze(state);

    expect(index(state, actions.changeView('list')))
      .to.have.property('view').that.equals('list');
  });

  it('should add to the selection on TOGGLE_SELECTED', () => {
    const state = { view: 'grid', selected: { } };
    deepFreeze(state);

    expect(index(state, actions.toggleSelected('linode_1234')))
      .to.have.property('selected')
      .which.has.property('linode_1234');

    expect(index(state, {
      type: actions.TOGGLE_SELECTED,
      selected: ['linode_1234', 'linode_1235'],
    })).to.have.property('selected')
      .which.has.keys('linode_1234', 'linode_1235');
  });

  it('should remove from the selection on TOGGLE_SELECTED', () => {
    const state = { view: 'grid', selected: {
      linode_1234: true,
      linode_1235: true,
    } };
    deepFreeze(state);

    expect(index(state, actions.toggleSelected('linode_1234')))
      .to.have.property('selected')
      .which./* does*/not.have.property('linode_1234');

    expect(index(state, actions.toggleSelected('linode_1234')))
      .to.have.property('selected')
      .which.has.keys('linode_1235');
  });
});
