import React, { Component, PropTypes } from 'react';
import reactMixin                      from 'react-mixin';
import { ListenerMixin }               from 'reflux';
import _                               from 'lodash';
import Mozaik                          from 'mozaik/browser';
const { BarChart }                     = Mozaik.Component;
class BurnDownLineChart extends Component {
    constructor(props) {
        super(props);
        this.state = { results: [] };
    }
    getApiRequest() {
        let { usr, pwd, boardID } = this.props;
        var chartType = 'burndown';
        return {
            id:     `jira.board.${ boardID }`,
            params: {
                usr:      usr,
                pwd:      pwd,
                boardID:  boardID,
                type: chartType
            }
        };
    }
    onApiData(results) {
        //var wrapper = [];
        //wrapper.push(results);
        this.setState({ results: _.clone(results[0]) });
    }
    render() {
        let { usr,pwd,boardID } = this.props;
        let { results }            = this.state;
        // converts to format required by BarChart component
        //var newArray = results.filter(function(e){return e});
        //console.log(newArray);
        //boardID = newArray[0].boardName;
        let data = results.map(function(item){
            boardID = item.boardName;
            var xlabel = item.resolutionDate + ' '+item.id;
            return {
                x:     xlabel,
                y:     item.storyPoints
            };

        });
        let barChartOptions = {
            mode:            'stacked',
            xLegend:         'date',
            xLegendPosition: 'right',
            yLegend:         'story points (unit)',
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
                    <BarChart data={[{ data: data }]} options={barChartOptions}/>
                </div>
            </div>
        );
    }
}
BurnDownLineChart.propTypes = {
    usr:      PropTypes.string.isRequired,
    pwd:      PropTypes.string.isRequired,
    boardID:  PropTypes.string.isRequired
};
reactMixin(BurnDownLineChart.prototype, ListenerMixin);
reactMixin(BurnDownLineChart.prototype, Mozaik.Mixin.ApiConsumer);
export default BurnDownLineChart;
