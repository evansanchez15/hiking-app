
import * as Point from 'esri/geometry/Point';
import * as dom from 'dojo/dom';
import * as on from 'dojo/on';
import * as domConstruct from 'dojo/dom-construct';
import * as domClass from 'dojo/dom-class';
import config from '../config';

declare let AmCharts: any;

import '../../style/detail-panel.scss';

import "font-awesome/scss/font-awesome.scss";

import { State, Trail } from '../types';

export default class SelectionPanel {

  trails: Array<Trail>;
  state: State;
  container: any;
  detailTitle: any;
  detailInfograph: any;
  detailElevationProfile: any;
  detailDescription: any;

  constructor(trails, state: State) {
    this.state = state;
    this.trails = trails;
    this.container = dom.byId('detailPanel');
    this.detailTitle = dom.byId("detailTitle");
    this.detailInfograph = dom.byId("detailInfograph");
    this.detailDescription = dom.byId("detailDescription");
    this.detailElevationProfile = dom.byId('detailElevationProfile');

    this.emptyDetails();

    state.watch('selectedTrailId', (id) => {
      if (id) {
        const selectedTrail = this.trails.filter((trail) => { return trail.id === id;})[0];
        this.displayInfo(selectedTrail);
      }
      else {
        this.emptyDetails();
      }
    });
  }

  emptyDetails() {
    domConstruct.empty(this.detailTitle);
    domConstruct.empty(this.detailInfograph);
    domConstruct.empty(this.detailElevationProfile);

    this.detailDescription.innerHTML = 'Select a hike in the map or in the Hikes panel to see more details about it.'
  }

  displayInfo(trail: Trail):void {

    // create title
    this.detailTitle.innerHTML = trail.name;

    // create infograph
    this.createInfograph(trail);

    // create the description container
    this.detailDescription.innerHTML = trail.description;

    // create the elevation profile
    this.createChart(trail.profileData);
  }

  createInfograph(trail) {

    const status = [{
      icon: 'fa fa-calendar-times-o',
      text: 'Closed'
    }, {
      icon: 'fa fa-calendar-check-o',
      text: 'Open'
    }];

    this.detailInfograph.innerHTML = `
      <span class='infograph'><span class='fa fa-line-chart' aria-hidden='true'></span> ${trail.ascent} m</span>
      <span class='infograph'><span class='fa fa-wrench' aria-hidden='true'></span> ${trail.difficulty}</span>
      <span class='infograph'><span class='fa fa-clock-o' aria-hidden='true'></span> ${trail.walktime} hr</span>
      <span class='infograph'><span class='${status[trail.status].icon}' aria-hidden='true'></span> ${status[trail.status].text}</span>
    `;

  }

  createChart(data) {

    let chart = AmCharts.makeChart(this.detailElevationProfile, {
      type:'serial',
      theme: 'light',
      dataProvider: data,
      color: '#4b4b4b',
      fontFamily: 'Open Sans Condensed',
      balloon: {
        borderAlpha: 0,
        fillAlpha: 0.8,
        fillColor: config.colors.selectedTrail,
        shadowAlpha: 0
      },
      graphs: [{
        id: "g1",
        balloonText: "Distance: <b>[[category]] km</b><br>Elevation:<b>[[value]] m</b>",
        fillAlphas: 0.2,
        bulletAlpha: 0,
        lineColor: config.colors.selectedTrail,
        lineThickness: 1,
        valueField: "value"
      }],
      chartCursor: {
        limitToGraph: "g1",
        categoryBalloonEnabled: false,
        zoomable: false
      },
      categoryField: "length",
      categoryAxis: {
        gridThickness: 0
      },
      valueAxes: [{
        strictMinMax: true,
        autoGridCount: false,
        minimum: 1000,
        maximum: 3500
      }]
    });

    let popup = this.state.view.popup;

    chart.addListener('changed', (e) => {
      if (e.index) {
        var data = e.chart.dataProvider[ e.index ];
        popup.dockEnabled = false;
        popup.open({
          title: data.value + " m",
          location: <Point>{
            spatialReference: { wkid: 4326 },
            longitude: data.point[0],
            latitude: data.point[1],
            z: data.point[2],
            type: 'point'
          }
        });
      } else {
        popup.close();
      }
    });
  }

}

