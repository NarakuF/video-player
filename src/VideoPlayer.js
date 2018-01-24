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
            description: "",
            offline: false,
        };
        this.handleChangeSource = this.handleChangeSource.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleChangeDescription = this.handleChangeDescription.bind(this);
        this.handleChangeRecordDescription = this.handleChangeRecordDescription.bind(this);
        this.handleDeleteRecord = this.handleDeleteRecord.bind(this);
        this.handlePlayRecord = this.handlePlayRecord.bind(this);
        this.handleUpdateRecord = this.handleUpdateRecord.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
    }

    componentDidMount() {
        // instantiate Video.js
        this.player = videojs(this.videoNode, this.props);
        this.player.markers({
            markerStyle: {
                'width': '5px',
                'border-radius': '0%',
                'background-color': 'red'
            },
            markers: [],
        });
    }

    // destroy player on unmount
    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
    }

    handleChangeSource(e) {
        e.preventDefault();
        let url = e.target.elements.source.value;
        if (url.includes("www.youtube.com")) {
            this.player.src({type: 'video/youtube', src: url});
        }
        else {
            this.player.src({src: url});
        }
        this.player.markers.reset([]);
        this.setState({record: -1, records: [], description: "", offline: false});
        console.log(this.state);
    }

    handleClick() {
        let markers = this.player.markers.getMarkers();
        const time = this.player.currentTime();
        if (this.state.record < 0) {

            this.player.markers.add([{
                time: time,
                duration: 0,
                text: "",
            }]);
            this.setState({record: time});
        }
        else {
            markers.forEach(m => {
                if (m.time === this.state.record) {
                    m.duration = time - m.time;
                }
            })
            this.player.markers.updateTime();
            this.setState({record: -1});
        }
        this.setState({records: markers});
    }

    handleChangeDescription(e) {
        e.preventDefault();
        this.setState({description: e.target.value});
    }

    handleChangeRecordDescription(e, rec) {
        let markers = this.player.markers.getMarkers();
        markers.forEach(m => {
            if (m.key === rec.key) {
                m.text = e.target.value;
            }
        });
        this.setState({records: markers});
    }

    handleDeleteRecord(rec) {
        let markers = this.player.markers.getMarkers();
        let i;
        for (i = 0; i < markers.length; i++) {
            if (markers[i].key === rec.key) {
                this.player.markers.remove([i]);
                break;
            }
        }
        this.setState({records: markers});
    }

    handlePlayRecord(rec) {
        this.player.play(this.player.currentTime(rec.time));
        let getToPlay = () => {
            if (this.player.currentTime() >= rec.time + rec.duration) {
                this.player.pause();
                this.player.off('timeupdate', getToPlay);
            }
        };
        this.player.on('timeupdate', getToPlay);
    }

    handleUpdateRecord(rec, n) {
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
    }

    render() {
        return (
            <div className="row justify-content-center">
                <form className="form-inline col-md-12 my-4 d-flex justify-content-center"
                      onSubmit={this.handleChangeSource}>
                    <input className="form-control w-75 mr-5" type="text" name="source"/>
                    <button className="btn btn-outline-primary" type="submit">View</button>
                </form>
                <div data-vjs-player className="col-md-10">
                    <video ref={node => this.videoNode = node} className="video-js"></video>
                </div>
                <div className="col-md-10 my-4 d-flex justify-content-center">
                    <button type="button"
                            className={"btn btn-outline-danger" + (this.state.record < 0 ? "" : " active")}
                            data-toggle="button" onClick={this.handleClick}>
                        {this.state.record < 0 ? 'Record' : 'Stop'}
                    </button>
                </div>
                <div className="col-md-10 my-4">
                    <h4>Description</h4>
                    <textarea className="form-control" rows="3"
                              placeholder={"This video is about ..."}
                              value={this.state.description}
                              onChange={this.handleChangeDescription}></textarea>
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
                                <th style={{width: '10%'}}>Begin</th>
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
                                                    onClick={e => this.handlePlayRecord(rec)}></button>
                                        </td>
                                        <td>{videojs.formatTime(rec.time)}
                                            <button className="btn btn-sm btn-outline-danger float-right"
                                                    onClick={e => this.handleUpdateRecord(rec, 1)}>Save
                                            </button>
                                        </td>
                                        <td>{videojs.formatTime(rec.time + rec.duration)}
                                            <button className="btn btn-sm btn-outline-danger float-right"
                                                    onClick={e => this.handleUpdateRecord(rec, 2)}>Save
                                            </button>
                                        </td>
                                        <td className="text-justify"><ContentEditable html={rec.text}
                                                                                      onChange={e => this.handleChangeRecordDescription(e, rec)}/>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-danger"
                                                    onClick={e => this.handleDeleteRecord(rec)}>Delete
                                            </button>
                                        </td>
                                    </tr>)
                            })}
                            </tbody>
                        </table>
                    </div>}
                </div>
                <div className="col-md-10">
                    <h4>Online Records</h4>
                    <table className="table table-striped table-bordered text-center">
                        <thead>
                        <tr>
                            <th style={{width: '5%'}}></th>
                            <th style={{width: '10%'}}>Begin</th>
                            <th style={{width: '10%'}}>End</th>
                            <th style={{width: '40%'}}>Description</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.records.map(rec => {
                            return (
                                <tr key={rec.key}>
                                    <td>
                                        <button className="btn btn-sm btn-primary"
                                                onClick={e => this.handlePlayRecord(rec)}></button>
                                    </td>
                                    <td>{videojs.formatTime(rec.time)}</td>
                                    <td>{videojs.formatTime(rec.time + rec.duration)}</td>
                                    <td className="text-justify"><ContentEditable html={rec.text}
                                                                                  onChange={e => this.handleChangeRecordDescription(e, rec)}/>
                                    </td>
                                </tr>)
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
}