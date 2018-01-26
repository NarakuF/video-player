import React from 'react';
import videojs from 'video.js';
import 'videojs-youtube';
import 'videojs-markers';
import ContentEditable from 'react-contenteditable';

export default class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            record: -1,
            records: [],
            description: '',
            offline: false,
            ended: false,
        };
        this.reset = this.reset.bind(this);
        this.changeSrc = this.changeSrc.bind(this);
        this.clickRecord = this.clickRecord.bind(this);
        this.changeDescription = this.changeDescription.bind(this);
        this.changeRecordDescription = this.changeRecordDescription.bind(this);
        this.deleteRecord = this.deleteRecord.bind(this);
        this.playRecord = this.playRecord.bind(this);
        this.updateRecord = this.updateRecord.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
    }

    componentDidMount() {
        this.player = videojs(this.videoNode, this.props);
        this.player.markers({
            markerStyle: {
                'width': '5px',
                'border-radius': '0%',
                'background-color': 'red'
            },
        });
        this.reset();
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
    }

    reset() {
        this.player.markers.reset([]);
        this.setState({
            record: -1,
            records: [],
            description: '',
            offline: false,
            ended: false,
        });
        this.player.controlBar.progressControl.disable();
        this.player.one('ended', () => {
            this.setState({ended: true});
            if (this.state.records.length > 0) {
                this.playRecord(this.state.records[0]);
                this.setState({record: this.state.records[0].time});
            }
        });
    }

    changeSrc(e) {
        e.preventDefault();
        let url = e.target.elements.source.value;
        if (url.includes('www.youtube.com')) {
            this.player.src({type: 'video/youtube', src: url});
        }
        else {
            this.player.src({src: url});
        }
        this.reset();
    }

    clickRecord() {
        let markers = this.player.markers.getMarkers();
        const time = this.player.currentTime();
        if (!this.state.ended && this.state.record < 0) {
            this.player.markers.add([{
                time: time,
                duration: 0,
                text: '',
            }]);
            this.setState({record: time});
        }
        else if (!this.state.ended) {
            const idx = markers.findIndex(m => m.time === this.state.record);
            markers[idx].duration = time - markers[idx].time;
            this.player.markers.updateTime();
            this.setState({record: -1});
        }
        this.setState({records: markers});
    }

    changeDescription(e) {
        this.setState({description: e.target.value});
    }

    changeRecordDescription(e, rec) {
        /*let markers = this.player.markers.getMarkers();
       const idx = markers.findIndex(m => m.key === rec.key);
       markers[idx].text = e.target.value;*/
        rec.text = e.target.value;
        //this.setState({records: markers});
        console.log(this.state.records)
        console.log(this.player.markers.getMarkers())
    }

    deleteRecord(rec) {
        let markers = this.player.markers.getMarkers();
        const idx = markers.findIndex(m => m.key === rec.key);
        this.player.markers.remove([idx]);
        this.setState({records: markers});
    }

    playRecord(rec) {
        this.player.play(this.player.currentTime(rec.time));
        let getToPlay = () => {
            if (this.player.currentTime() >= rec.time + rec.duration) {
                this.player.pause();
                this.player.off('timeupdate', getToPlay);
            }
        };
        this.player.on('timeupdate', getToPlay);
    }

    updateRecord(rec, n) {
        let markers = this.player.markers.getMarkers();
        const time = this.player.currentTime();
        markers.forEach(m => {
            if (m.key === rec.key) {
                if (n === 1) {
                    const end = m.time + m.duration;
                    m.time = time;
                    m.duration = end - m.time;
                }
                else if (n === 2) {
                    m.duration = time - m.time;
                }
            }
        });
        this.player.markers.updateTime();
        this.setState({records: markers});
    }

    handleOffline() {
        this.setState(prevState => ({offline: !prevState.offline}));
        this.player.controlBar.progressControl.enable();
    }

    render() {
        return (
            <div className="row">
                <div className="col-md-12 my-4">
                    <form className="form-inline mb-4 justify-content-around"
                          onSubmit={this.changeSrc}>
                        <input className="form-control" style={{width: '90%'}} type="text" name="source"/>
                        <button className="btn btn-outline-primary" type="submit">View</button>
                    </form>
                    <form className="form-inline justify-content-around">
                        <h5>Description:</h5>
                        <textarea className="form-control" rows="3"
                                  style={{width: '90%'}}
                                  placeholder={"This video is about ..."}
                                  value={this.state.description}
                                  onChange={this.changeDescription}></textarea>
                    </form>
                </div>
                <div data-vjs-player className="col-md-10">
                    <video ref={node => this.videoNode = node} className="video-js"></video>
                </div>
                <div className="col-md-2">
                    <table className="table table-sm table-striped table-bordered text-center">
                        <thead>
                        <tr>
                            <th>    Markers</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.records.map(rec => {
                            return (
                                <tr key={rec.key}>
                                    <td>
                                        <button className="btn btn-sm btn-primary"
                                                onClick={() => this.playRecord(rec)}>{videojs.formatTime(rec.time)}</button>
                                    </td>
                                </tr>)
                        })}
                        </tbody>
                    </table>
                </div>
                <div className="col-md-10 my-4 d-flex justify-content-around">
                    {!this.state.ended ?
                        <button type="button"
                                className={"btn btn-outline-danger" + (this.state.record < 0 ? "" : " active")}
                                data-toggle="button" onClick={this.clickRecord}>
                            {this.state.record < 0 ? 'Record' : 'Stop'}
                        </button>
                        :
                        <form className="form-inline w-100 d-flex justify-content-around">
                            <button className="btn btn-danger"
                                    onClick={() => this.playRecord(
                                        this.state.records[Math.max(this.state.records.findIndex(this.state.record), 0)])}>Prev
                            </button>
                            <button className="btn btn-danger"
                                    onClick={() => this.playRecord(0)}>Next
                            </button>
                            <input className="form-control w-75" type="text"
                                   placeholder="This is about ..."
                                   value=""
                                   onChange={e => console.log(this.state.records)}/>
                        </form>}
                </div>
                <div className="col-md-10 mb-4">
                    <button type="button"
                            className={"btn btn-sm btn-outline-danger my-2" + (this.state.offline ? " active" : "")}
                            data-toggle="button"
                            onClick={this.handleOffline}>Offline
                    </button>
                    {this.state.offline &&
                    <div>
                        <h4>Offline Editor</h4>
                        <table className="table table-striped table-bordered text-center">
                            <thead>
                            <tr>
                                <th style={{width: '5%'}}></th>
                                <th style={{width: '10%'}}>Start</th>
                                <th style={{width: '10%'}}>End</th>
                                <th style={{width: '40%'}}>Description</th>
                                <th style={{width: '5%'}}></th>
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.records.map(rec => {
                                return (
                                    <tr key={rec.key}>
                                        <td>
                                            <button className="btn btn-sm btn-primary"
                                                    onClick={() => this.playRecord(rec)}></button>
                                        </td>
                                        <td>{videojs.formatTime(rec.time)}
                                            <button className="btn btn-sm btn-outline-danger float-right"
                                                    onClick={() => this.updateRecord(rec, 1)}>Save
                                            </button>
                                        </td>
                                        <td>{videojs.formatTime(rec.time + rec.duration)}
                                            <button className="btn btn-sm btn-outline-danger float-right"
                                                    onClick={() => this.updateRecord(rec, 2)}>Save
                                            </button>
                                        </td>
                                        <td className="text-justify"><ContentEditable html={rec.text}
                                                                                      onChange={e => this.changeRecordDescription(e, rec)}/>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-danger"
                                                    onClick={e => this.deleteRecord(rec)}>Delete
                                            </button>
                                        </td>
                                    </tr>)
                            })}
                            </tbody>
                        </table>
                    </div>}
                </div>
            </div>
        )
    }
}