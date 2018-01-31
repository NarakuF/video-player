import React from "react";
import videojs from "video.js";
import "videojs-youtube";
import "videojs-markers";
import ContentEditable from "react-contenteditable";

const Status = Object.freeze({
    VIEW: 1,
    ENDED: 2,
    REVIEW: 3,
    FINISHED: 4,
    OFFLINE: 5,
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
        this.readyOffline = this.readyOffline.bind(this);
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
            this.setState({status: Status.ENDED});
            if (this.state.records.length > 0) {
                this.setState({rec_id: this.state.records[0].key});
                this.playRecord(this.state.records[0]);
            }
        });
    }

    getIdx() {
        return this.state.records.findIndex(rec => rec.key === this.state.rec_id);
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
        if (this.state.status !== Status.OFFLINE && this.readyOffline()) {
            this.setState({status: Status.FINISHED});
        }
    }

    changeRecordDescription(e, rec) {
        rec.text = e.target.value;
        this.setState({records: this.state.records});
        if (this.state.status !== Status.OFFLINE && this.readyOffline()) {
            this.setState({status: Status.FINISHED});
        }
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

    readyOffline() {
        let flag = this.state.description;
        this.state.records.map(rec => flag = rec.text && flag);
        return flag;
    }

    offline() {
        const onlineCopy = JSON.parse(JSON.stringify(this.state.records));
        this.setState({onlineCopy: onlineCopy, status: Status.OFFLINE});
        this.player.controlBar.progressControl.enable();
    }

    prev() {
        const idx = this.getIdx();
        if (idx - 1 >= 0) {
            this.playRecord(this.state.records[idx - 1]);
        }
    }

    next() {
        const idx = this.getIdx();
        if (idx + 1 < this.state.records.length) {
            this.playRecord(this.state.records[idx + 1]);
        }
    }

    renderToolBar(status) {
        switch (status) {
            case Status.VIEW:
                return
                <button type="button"
                        className={"btn btn-outline-danger" + (this.state.record < 0 ? "" : " active")}
                        data-toggle="button" onClick={this.clickRecord}>
                    {this.state.record < 0 ? "Record" : "Stop"}
                </button>;
            case Status.ENDED:
                return
                <div className="form-inline w-100 d-flex justify-content-around">
                    <button className="btn btn-danger"
                            onClick={() => this.prev()}>Prev
                    </button>
                    <button className="btn btn-danger"
                            onClick={() => this.next()}>Next
                    </button>
                    {this.state.records.filter(rec => rec.key === this.state.rec_id).map(rec => {
                        return (
                            <input key={rec.key} className="form-control w-75" type="text"
                                   placeholder="This is about ..."
                                   value={rec.text}
                                   onChange={e => this.changeRecordDescription(e, rec)}/>
                        );
                    })}
                </div>;
            case Status.REVIEW:
                return <div></div>;
            case Status.FINISHED:
                return <div></div>;
            case Status.OFFLINE:
                return <div></div>;
            default:
                console.log(1);
                return null;
        }
    }

    render() {
        return (
            <div className="row">
                <div id="search_bar" className="col-md-12 my-4">
                    <form className="form-inline mb-4 justify-content-around"
                          onSubmit={this.changeSrc}>
                        <input className="form-control" style={{width: "90%"}} type="text" name="source"/>
                        <button className="btn btn-outline-primary" type="submit">View</button>
                    </form>
                    <div className="form-inline justify-content-around">
                        <h5>Description:</h5>
                        <textarea className="form-control" rows="3"
                                  style={{width: "90%"}}
                                  placeholder={"This video is about ..."}
                                  value={this.state.description}
                                  onChange={this.changeDescription}></textarea>
                    </div>
                </div>
                <div id="video_player" data-vjs-player className="col-md-10">
                    <video ref={node => this.videoNode = node} className="video-js"></video>
                </div>


                <div id="markers_list" className="col-md-2">
                    <table className="table table-sm table-striped table-bordered text-center">
                        <thead>
                        <tr>
                            <th>Markers</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.records.map(rec => {
                            return (
                                <tr key={rec.key}>
                                    <td>
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
                    {this.state.status === Status.VIEW &&
                    <button type="button"
                            className={"btn btn-outline-danger" + (this.state.record < 0 ? "" : " active")}
                            data-toggle="button" onClick={this.clickRecord}>
                        {this.state.record < 0 ? "Record" : "Stop"}
                    </button>}
                    {this.state.status === Status.ENDED &&
                    <div className="form-inline w-100 d-flex justify-content-around">
                        <button className="btn btn-danger"
                                onClick={() => this.prev()}>Prev
                        </button>
                        <button className="btn btn-danger"
                                onClick={() => this.next()}>Next
                        </button>
                        {this.state.records.filter(rec => rec.key === this.state.rec_id).map(rec => {
                            return (
                                <input key={rec.key} className="form-control w-75" type="text"
                                       placeholder="This is about ..."
                                       value={rec.text}
                                       onChange={e => this.changeRecordDescription(e, rec)}/>
                            );
                        })}
                    </div>}
                </div>


                <div className="col-md-10 my- ">
                    <button
                        className={"btn btn-outline-danger" + (this.state.status === Status.FINISHED ? " active" : "")}
                        disabled={this.state.status !== Status.FINISHED}
                        onClick={() => this.offline()}>Offline
                    </button>
                    {this.state.status === Status.OFFLINE &&
                    <div>
                        <table className="table table-striped table-bordered text-center">
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
                        </table>
                    </div>}
                </div>
            </div>
        )
    }
}