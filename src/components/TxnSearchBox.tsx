import {inject, observer} from 'mobx-react';
import * as React from 'react';

import Store from '../store';

@inject('store')
@observer
export default class TxnSearchBox extends React.Component<{store?: Store}> {
  public render() {
    return <input value={this.props.store!.searchTerm.get()} onChange={(e: any) => this.props.store!.setSearchTerm(e.target.value)} />;
  }
}
