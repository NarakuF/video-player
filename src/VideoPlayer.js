import React from "react";
import videojs from "video.js";
import "videojs-youtube";
import "videojs-markers";
import ContentEditable from "react-contenteditable";

const Status = Object.freeze({
    VIEW: 1,
    REVIEW: 2,
    OFFLINE: 3,
});

export default class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            record: -1,
            rec_id: "",
            records: [],
            onlineCopy: [],
            description: "",
            status: Status.VIEW,
        };
        this.reset = this.reset.bind(this);
        this.getIdx = this.getIdx.bind(this);
        this.getRec = this.getRec.bind(this);
        this.changeSrc = this.changeSrc.bind(this);
        this.clickRecord = this.clickRecord.bind(this);
        this.changeDescription = this.changeDescription.bind(this);
        this.changeRecordDescription = this.changeRecordDescription.bind(this);
        this.deleteRecord = this.deleteRecord.bind(this);
        this.playRecord = this.playRecord.bind(this);
        this.updateRecord = this.updateRecord.bind(this);
        this.offline = this.offline.bind(this);
        this.prev = this.prev.bind(this);
        this.next = this.next.bind(this);
        this.renderToolBar = this.renderToolBar.bind(this);
    }

    componentDidMount() {
        this.player = videojs(this.videoNode, this.props);
        this.player.markers({
            markerStyle: {
                "width": "5px",
                "border-radius": "0%",
                "background-color": "red"
            },
            onMarkerClick: function () {
                return false
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
            rec_id: "",
            records: [],
            offlineRecords: [],
            description: "",
            status: Status.VIEW,
        });
        this.player.controlBar.progressControl.disable();
        this.player.one("ended", () => {
            this.setState({status: Status.REVIEW});
            if (this.state.records.length > 0) {
                this.setState({description: ""});
                this.playRecord(this.state.records[0]);
            }
        });
    }

    getIdx(key = this.state.rec_id) {
        return this.state.records.findIndex(rec => rec.key === key);
    }

    getRec(key) {
        return this.state.records.find(rec => rec.key === key);
    }

    changeSrc(e) {
        e.preventDefault();
        const url = e.target.elements.source.value;
        if (url.includes("www.youtube.com")) {
            this.player.src({type: "video/youtube", src: url});
        }
        else {
            this.player.src({src: url});
        }
        this.reset();
    }

    clickRecord() {
        const markers = this.player.markers.getMarkers();
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
            const idx = markers.findIndex(m => m.time === this.state.record);
            markers[idx].duration = time - markers[idx].time;
            this.player.markers.updateTime();
            this.setState({record: -1});
        }
        this.setState({records: markers});
    }

    changeDescription(e) {
        e.preventDefault();
        this.setState({description: e.target.value});
    }

    changeRecordDescription(e, rec) {
        console.log(this.state.records)
        rec.text = e.target.value;
        this.setState({records: this.state.records});
    }

    deleteRecord(rec) {
        const markers = this.player.markers.getMarkers();
        const idx = markers.findIndex(m => m.key === rec.key);
        this.player.markers.remove([idx]);
        this.setState({records: markers});
    }

    playRecord(rec) {
        this.player.play(this.player.currentTime(rec.time));
        let getToPlay = () => {
            if (this.player.currentTime() >= rec.time + rec.duration) {
                this.player.pause();
                this.player.off("timeupdate", getToPlay);
            }
        };
        this.player.on("timeupdate", getToPlay);
        this.setState({rec_id: rec.key});
    }

    updateRecord(rec, n) {
        const time = this.player.currentTime();
        if (n === 1) {
            const end = rec.time + rec.duration;
            rec.time = time;
            rec.duration = end - rec.time;
        }
        else {
            rec.duration = time - rec.time;
        }
        this.player.markers.updateTime();
        this.setState({records: this.state.records});
    }

    offline(e) {
        e.preventDefault();
        let flag = this.state.description;
        this.state.records.map(rec => flag = flag && rec.text);
        if (flag) {
            const onlineCopy = JSON.parse(JSON.stringify(this.state.records));
            this.setState({onlineCopy: onlineCopy, status: Status.OFFLINE});
            this.player.controlBar.progressControl.enable();
        }
        else {
            alert("Please fill in all descriptions.");
        }
    }

    prev(e) {
        e.preventDefault();
        const idx = this.getIdx();
        if (idx - 1 >= 0) {
            this.playRecord(this.state.records[idx - 1]);
        }
    }

    next(e) {
        e.preventDefault();
        const idx = this.getIdx();
        if (idx + 1 < this.state.records.length) {
            this.playRecord(this.state.records[idx + 1]);
        }
    }

    renderToolBar() {
        switch (this.state.status) {
            case Status.VIEW:
                return <button type="button"
                               className={"btn btn-outline-danger" + (this.state.record < 0 ? "" : " active")}
                               data-toggle="button" onClick={this.clickRecord}>
                    {this.state.record < 0 ? "Record" : "Stop"}
                </button>;
            case Status.REVIEW:
                return <form className="w-100">
                    <div className="form-group mb-4 d-flex justify-content-around">
                        <button className="btn btn-danger"
                                onClick={this.prev}>Prev
                        </button>
                        <button className="btn btn-danger"
                                onClick={this.next}>Next
                        </button>
                        {this.state.records.filter(rec => rec.key === this.state.rec_id).map(rec => {
                            return (
                                <input key={rec.key} className="form-control w-75" type="text"
                                       placeholder="This is about ..."
                                       value={rec.text}
                                       onChange={e => this.changeRecordDescription(e, rec)}/>
                            );
                        })}
                    </div>
                    <div className="form-group d-flex justify-content-around">
                        <textarea className="form-control" rows="3"
                                  placeholder={"Video Description: This video is about ..."}
                                  value={this.state.description}
                                  onChange={this.changeDescription}></textarea>
                        <button className="btn btn-outline-danger"
                                onClick={this.offline}>Finish
                        </button>
                    </div>
                </form>;
            case Status.OFFLINE:
                console.log("offline");
                return <table className="table table-striped table-bordered text-center">
                    <thead>
                    <tr>
                        <th style={{width: "10%"}}>Start</th>
                        <th style={{width: "10%"}}>End</th>
                        <th style={{width: "40%"}}>Description</th>
                        <th style={{width: "5%"}}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {this.state.records.map(rec => {
                        return (
                            <tr key={rec.key}>
                                <td style={{width: "10%"}}>{videojs.formatTime(rec.time)}
                                    <button className="btn btn-sm btn-outline-danger float-right"
                                            onClick={() => this.updateRecord(rec, 1)}>Save
                                    </button>
                                </td>
                                <td style={{width: "10%"}}>{videojs.formatTime(rec.time + rec.duration)}
                                    <button className="btn btn-sm btn-outline-danger float-right"
                                            onClick={() => this.updateRecord(rec, 2)}>Save
                                    </button>
                                </td>
                                <td style={{width: "40%"}} className="text-justify"><ContentEditable
                                    html={rec.text}
                                    onChange={e => this.changeRecordDescription(e, rec)}/>
                                </td>
                                <td style={{width: "5%"}}>
                                    <button className="btn btn-sm btn-outline-danger"
                                            onClick={e => this.deleteRecord(rec)}>Delete
                                    </button>
                                </td>
                            </tr>)
                    })}
                    </tbody>
                </table>;
            default:
                console.log(0);
                return null;
        }
    }

    render() {
        return (
            <div className="row">
                <div id="search_bar" className="col-md-12 my-4">
                    <form className="form-inline justify-content-around"
                          onSubmit={this.changeSrc}>
                        <input className="form-control" style={{width: "90%"}} type="text" name="source"/>
                        <button className="btn btn-outline-primary" type="submit">View</button>
                    </form>
                </div>
                <div id="video_player" data-vjs-player className="col-md-10">
                    <video ref={node => this.videoNode = node} className="video-js"></video>
                </div>

                <div id="markers_list" className="col-md-2">
                    <table className="table table-sm table-striped table-bordered text-center">
                        <thead className="mkl-h">
                        <tr className="mkl-r">
                            <th className="mkl-h">Markers</th>
                        </tr>
                        </thead>
                        <tbody className="mkl-b">
                        {this.state.records.map(rec => {
                            return (
                                <tr className="mkl-r" key={rec.key}>
                                    <td className="mkl-d">
                                        <button
                                            className={"btn btn-sm" + (rec.text ? " btn-success" : " btn-outline-success")
                                            + (this.state.rec_id === rec.key ? " active" : "")}
                                            disabled={this.state.status === Status.VIEW}
                                            onClick={() => this.playRecord(rec)}>{videojs.formatTime(rec.time)}</button>
                                    </td>
                                </tr>)
                        })}
                        </tbody>
                    </table>
                </div>

                <div className="col-md-10 my-4 d-flex justify-content-around">
                    {this.renderToolBar()}
                </div>
            </div>
        )
    }
}