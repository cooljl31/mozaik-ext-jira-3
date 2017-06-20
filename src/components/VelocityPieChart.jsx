import React, { Component, PropTypes } from 'react';
import reactMixin                      from 'react-mixin';
import { ListenerMixin }               from 'reflux';
import _                               from 'lodash';
import Mozaik                          from 'mozaik/browser';
const  { Pie }                         = Mozaik.Component;
class VelocityPieChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      total:  0,
      labels: []
    };
  }
  getApiRequest() {
    let { boardID} = this.props;
    var chartType = 'velocity';
    var numSprint = '1';
    return {
      id:     `jira.board.${ boardID }.piechart`,
      params: {
        boardID:  boardID,
        type: chartType,
        numOfSprint: numSprint
      }
    };
  }
  onApiData(sprints) {
    var labels = [];
    var colors = ["f29513","ADE09B","CE9BE0","E0AC9B","CD6155","EC7063","AF7AC5","BB8FCE","7FB3D5","76D7C4","73C6B6","F7DC6F","E59866","D5DBDB"];
    var count = 0;
    sprints.forEach(sprint => {
      count = sprint.velocity;
      var numOfFeature = sprint.velocity - sprint.bugIssue;
      labels.push({id: sprint.name + ' #features ', color: colors[Math.floor(Math.random()*colors.length)], name: sprint.boardName+ '( '+sprint.sLength+'work days)', count:numOfFeature});
      labels.push({id: sprint.name + ' #bugs', color: colors[Math.floor(Math.random()*colors.length)], name: sprint.boardName+ '( '+sprint.sLength+'work days)', count:sprint.bugIssue});
    });
    this.setState({
      labels: labels,
      total:  count
    });
  }
  render() {
    let { labels, total }     = this.state;
    let { boardID} = this.props;
    //let flatLabels = _.values(labels);
    let data       = labels.map(label => {
      boardID = label.name;
      label.color = `#${ label.color }`;
      label.id    = label.id;
      label.label = label.id;
      return label;
    });
    return (
      <div>
      <div className="widget__header">
      <span className="widget__header__subject">{ boardID }</span>
      <i className="fa fa-pie-chart" />
      </div>
      <div className="widget__body">
      <Pie data={data} count={total} countLabel={total > 1 ? 'points' : 'point'} innerRadius={0.7}/>
      </div>
      </div>
    );
  }
}
VelocityPieChart.PropTypes = {
  boardID: PropTypes.string.isRequired
}
reactMixin(VelocityPieChart.prototype, ListenerMixin);
reactMixin(VelocityPieChart.prototype, Mozaik.Mixin.ApiConsumer);
export default VelocityPieChart;
