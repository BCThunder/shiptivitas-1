import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    const clients = this.getClients();
    // If allBacklog prop is set, put every card in backlog (and update status)
    if (props && props.allBacklog) {
      const backlogClients = clients.map(c => ({...c, status: 'backlog'}));
      this.state = { clients: { backlog: backlogClients, inProgress: [], complete: [] } };
    } else {
      this.state = {
        clients: {
          backlog: clients.filter(client => !client.status || client.status === 'backlog'),
          inProgress: clients.filter(client => client.status && client.status === 'in-progress'),
          complete: clients.filter(client => client.status && client.status === 'complete'),
        }
      }
    }
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    }
    this.drake = null;
  }
  componentDidMount() {
    const containers = [
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current,
    ].filter(Boolean);
    if (containers.length) {
      this.drake = Dragula(containers);
      this.drake.on('drop', (el, target, source, sibling) => this.handleDrop(el, target, source, sibling));
    }
  }

  componentWillUnmount() {
    if (this.drake) {
      this.drake.destroy();
      this.drake = null;
    }
  }

  containerKey(container) {
    if (container === this.swimlanes.backlog.current) return 'backlog';
    if (container === this.swimlanes.inProgress.current) return 'inProgress';
    if (container === this.swimlanes.complete.current) return 'complete';
    return null;
  }

  handleDrop(el, target, source, sibling) {
    try {
      if (!el) return;
      const id = el.getAttribute && el.getAttribute('data-id');

      // Normalize containers: sometimes dragula may pass inner nodes; find closest drag column
      const normalize = node => {
        if (!node) return null;
        if (node.classList && node.classList.contains('Swimlane-dragColumn')) return node;
        return node.closest && node.closest('.Swimlane-dragColumn');
      };
      const normSource = normalize(source) || normalize(el.parentNode);
      const normTarget = normalize(target) || normalize(el.parentNode);

      const sourceKey = this.containerKey(normSource);
      const targetKey = this.containerKey(normTarget);
      if (!id || !sourceKey || !targetKey) return;

      // shallow copy arrays
      const clients = {
        backlog: [...this.state.clients.backlog],
        inProgress: [...this.state.clients.inProgress],
        complete: [...this.state.clients.complete],
      };

      // find and remove from source
      const sourceArr = clients[sourceKey];
      const idx = sourceArr.findIndex(c => String(c.id) === String(id));
      if (idx === -1) return;
      const [moved] = sourceArr.splice(idx, 1);

      // update status for cross-swimlane moves
      if (sourceKey !== targetKey) {
        if (targetKey === 'backlog') moved.status = 'backlog';
        if (targetKey === 'inProgress') moved.status = 'in-progress';
        if (targetKey === 'complete') moved.status = 'complete';
      }

      // insert into target at position determined by sibling
      const targetArr = clients[targetKey];
      if (!sibling) {
        targetArr.push(moved);
      } else {
        const siblingEl = sibling.nodeType === 1 ? sibling : (sibling.closest && sibling.closest('[data-id]'));
        const siblingId = siblingEl && siblingEl.getAttribute && siblingEl.getAttribute('data-id');
        const sibIndex = siblingId ? targetArr.findIndex(c => String(c.id) === String(siblingId)) : -1;
        if (sibIndex === -1) targetArr.push(moved);
        else targetArr.splice(sibIndex, 0, moved);
      }

      this.setState({ clients });
    } catch (err) {
      // Don't allow drag errors to crash the app; log for debugging
      // eslint-disable-next-line no-console
      console.error('Drag handling error', err);
    }
  }
  getClients() {
    return [
      ['1','Stark, White and Abbott','Cloned Optimal Architecture', 'in-progress'],
      ['2','Wiza LLC','Exclusive Bandwidth-Monitored Implementation', 'complete'],
      ['3','Nolan LLC','Vision-Oriented 4Thgeneration Graphicaluserinterface', 'backlog'],
      ['4','Thompson PLC','Streamlined Regional Knowledgeuser', 'in-progress'],
      ['5','Walker-Williamson','Team-Oriented 6Thgeneration Matrix', 'in-progress'],
      ['6','Boehm and Sons','Automated Systematic Paradigm', 'backlog'],
      ['7','Runolfsson, Hegmann and Block','Integrated Transitional Strategy', 'backlog'],
      ['8','Schumm-Labadie','Operative Heuristic Challenge', 'backlog'],
      ['9','Kohler Group','Re-Contextualized Multi-Tasking Attitude', 'backlog'],
      ['10','Romaguera Inc','Managed Foreground Toolset', 'backlog'],
      ['11','Reilly-King','Future-Proofed Interactive Toolset', 'complete'],
      ['12','Emard, Champlin and Runolfsdottir','Devolved Needs-Based Capability', 'backlog'],
      ['13','Fritsch, Cronin and Wolff','Open-Source 3Rdgeneration Website', 'complete'],
      ['14','Borer LLC','Profit-Focused Incremental Orchestration', 'backlog'],
      ['15','Emmerich-Ankunding','User-Centric Stable Extranet', 'in-progress'],
      ['16','Willms-Abbott','Progressive Bandwidth-Monitored Access', 'in-progress'],
      ['17','Brekke PLC','Intuitive User-Facing Customerloyalty', 'complete'],
      ['18','Bins, Toy and Klocko','Integrated Assymetric Software', 'backlog'],
      ['19','Hodkiewicz-Hayes','Programmable Systematic Securedline', 'backlog'],
      ['20','Murphy, Lang and Ferry','Organized Explicit Access', 'backlog'],
    ].map(companyDetails => ({
      id: companyDetails[0],
      name: companyDetails[1],
      description: companyDetails[2],
      status: companyDetails[3],
    }));
  }
  renderSwimlane(name, clients, ref) {
    return (
      <Swimlane name={name} clients={clients} dragulaRef={ref}/>
    );
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane('Backlog', this.state.clients.backlog, this.swimlanes.backlog)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('In Progress', this.state.clients.inProgress, this.swimlanes.inProgress)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('Complete', this.state.clients.complete, this.swimlanes.complete)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
