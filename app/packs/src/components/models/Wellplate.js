import React from 'react';
import Element from './Element';
import Well from './Well';
import Sample from './Sample';
import Segment from './Segment';
import Container from './Container';

export default class Wellplate extends Element {
  constructor(args) {
    super(args);
    this.wells = this.initWellsWithPosition(this.wells, 96);
    this._checksum = this.checksum();
  }

  static buildEmpty(collectionID) {
    return new Wellplate({
      collection_id: collectionID,
      type: 'wellplate',
      name: 'New Wellplate',
      size: 96,
      description: Wellplate.quillDefault(),
      wells: [],
      readout_titles: [],
      container: Container.init(),
      segments: [],
      attachments: [],
    });
  }

  static buildFromSamplesAndCollectionId(clipboardSamples, collection_id) {
    let samples = clipboardSamples.map(sample => {
      return sample.buildChild();
    });

    let wells = samples.map(sample => {
      return new Well({
        sample: sample,
        readouts: []
      });
    })

    return new Wellplate({
      collection_id,
      type: 'wellplate',
      name: 'New Wellplate',
      size: 96,
      description: Wellplate.quillDefault(),
      wells,
      readout_titles: [],
      container: Container.init(),
      segments: [],
      attachments: [],
    });
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get description() {
    return this._description;
  }

  set description(description) {
    this._description = description;
  }

  get wells() {
    return this._wells
  }

  set wells(wells) {
    this._wells = wells.map(w => new Well(w));
  }

  set segments(segments) {
    this._segments = (segments && segments.map(s => new Segment(s))) || [];
  }

  get segments() {
    return this._segments || [];
  }

  serialize() {
    return super.serialize({
      name: this.name,
      size: this.size,
      description: this.description,
      wells: this.wells.map(w => w.serialize()),
      readout_titles: this.readout_titles,
      container: this.container,
      segments: this.segments.map(s => s.serialize()),
      attachments: this.attachments,
    });
  }

  // ---

  initWellsWithPosition(wells, size) {
    const placeholdersCount = size - wells.length;
    const placeholders = Array(placeholdersCount).fill({});
    const allWells = wells.concat(placeholders);
    return allWells.map((well, i) => this.initWellWithPositionByIndex(well, i));
  }

  initWellWithPositionByIndex(well, i) {
    return {
      ...well,
      position: this.calculatePositionOfWellByIndex(i),
      readouts: []
    };
  }

  calculatePositionOfWellByIndex(i) { // eslint-disable-line class-methods-use-this
    const cols = 12;
    const remainder = (i + 1) % cols;
    return {
      x: (remainder === 0) ? cols : remainder,
      y: Math.floor(i / cols) + 1
    };
  }

  title() {
    return (
      <span>
        <span>{this.short_label}</span>
        <span>{`  ${this.name}`}</span>
      </span>);
  }
}
