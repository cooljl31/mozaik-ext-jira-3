import React, { Component, PropTypes } from 'react';
import reactMixin                      from 'react-mixin';
import { ListenerMixin }               from 'reflux';
import _                               from 'lodash';
import Mozaik                          from 'mozaik/browser';
const { BarChart }                     = Mozaik.Component;
class VelocityBarChart extends Component {
    constructor(props) {
        super(props);
        this.state = { results: [] };
    }
    getApiRequest() {
        let { boardID, numOfSprint} = this.props;
        var chartType = 'velocity';
        return {
            id:     `jira.board.${ boardID }.barchart`,
            params: {
                boardID:  boardID,
                numOfSprint: numOfSprint,
                type: chartType
            }
        };
    }
    onApiData(results) {
        //var wrapper = [];
        //wrapper.push(results);
        this.setState({ results: _.clone(results) });
    }
    render() {
        let { boardID, numOfSprint } = this.props;
        let { results }            = this.state;
        var lastVelocity = 0;
        // converts to format required by BarChart component
        //var newArray = results.filter(function(e){return e});
        //console.log(newArray);
        //boardID = newArray[0].boardName;
        let data = results.map(function(item){
            boardID = item.boardName;
            lastVelocity = item.velocity;
            var xlabel = item.name +' [ '+item.sLength + ' d(s) ]'
            return {
                x:     xlabel,
                y:     item.velocity
            };

        });
        let barChartOptions = {
            mode:            'stacked',
            xLegend:         'sprint[length]',
            xLegendPosition: 'right',
            yLegend:         'velocity (unit)',
            yLegendPosition: 'top',
            xPadding:        0.3,
            barColor:        `#47C4F5`
        };
        return (
            <div>
                <div className="widget__header">
                    <span className="widget__header__subject">board { boardID }</span> velocity
                    <i className="fa fa-bar-chart" />
                </div>
                <div className="widget__body">
                    <h4>Last Sprint: { lastVelocity }</h4>
                    <BarChart data={[{ data: data }]} options={barChartOptions}/>
                </div>
            </div>
        );
    }
}
VelocityBarChart.propTypes = {
    boardID:  PropTypes.string.isRequired,
    numOfSprint: PropTypes.string.isRequired
};
reactMixin(VelocityBarChart.prototype, ListenerMixin);
reactMixin(VelocityBarChart.prototype, Mozaik.Mixin.ApiConsumer);
export default VelocityBarChart;
