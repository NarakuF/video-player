import React from 'react';
import videojs from 'video.js';
import 'videojs-youtube';
import 'videojs-markers';
import ContentEditable from 'react-contenteditable';
import axios from 'axios';

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
            rec_key: "",
            records: [],
            onlineCopy: [],
            description: "",
            status: Status.VIEW,
            timeOffset: 1,
        };
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.reset = this.reset.bind(this);
        this.getIdx = this.getIdx.bind(this);
        this.getKey = this.getKey.bind(this);
        this.changeSrc = this.changeSrc.bind(this);
        this.clickRecord = this.clickRecord.bind(this);
        this.changeDescription = this.changeDescription.bind(this);
        this.changeRecordDescription = this.changeRecordDescription.bind(this);
        this.deleteRecord = this.deleteRecord.bind(this);
        this.playRecord = this.playRecord.bind(this);
        this.addRecord = this.addRecord.bind(this);
        this.updateRecord = this.updateRecord.bind(this);
        this.offline = this.offline.bind(this);
        this.prev = this.prev.bind(this);
        this.next = this.next.bind(this);
        this.jump = this.jump.bind(this);
        this.save = this.save.bind(this);
        this.renderOfflineTable = this.renderOfflineTable.bind(this);
        this.renderToolBar = this.renderToolBar.bind(this);
    }

    componentDidMount() {
        this.player = videojs(this.videoNode, this.props);
        this.player.markers({
            markerStyle: {
                "width": "5px",
                "border-radius": "0%",
                "background-color": "red",
            },
            onMarkerClick: function () {
                return false;
            },
        });
        this.reset();
        window.addEventListener('keydown', this.handleKeyPress);
    }

    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
            window.removeEventListener('keydown', this.handleKeyPress);
        }
    }

    handleKeyPress(e) {
        e = e || window.event;
        const target = e.target || e.srcElement;
        const targetTagName = (target.nodeType === 1) ? target.nodeName.toUpperCase() : "";
        console.log(targetTagName)
        if (this.player && this.state.status === Status.OFFLINE && !/INPUT|SELECT|TEXTAREA|DIV/.test(targetTagName)) {
            switch (e.keyCode) {
                // Space
                case 32:
                    this.player.paused() ? this.player.play() : this.player.pause();
                    break;
                // ArrowLeft
                case 37:
                    this.jump(-this.state.timeOffset - 0.4);
                    break;
                // ArrowUp
                case 38:
                    this.prev();
                    break;
                // ArrowRight
                case 39:
                    this.jump();
                    break;
                case 40:
                    this.next();
                    break;
                default:
                    break;
            }
        }
    }

    reset() {
        this.player.markers.reset([]);
        this.setState({
            record: -1,
            rec_key: "",
            records: [],
            offlineRecords: [],
            description: "",
            status: Status.VIEW,
            timeOffset: 1,
        });
        this.player.controlBar.progressControl.disable();
        this.player.one("ended", () => {
            this.setState({status: Status.REVIEW});
            if (this.state.records.length > 0) {
                this.setState({description: ""});
                this.playRecord(this.getKey(0));
            }
        });
    }

    getIdx(key = this.state.rec_key) {
        return this.state.records.findIndex(rec => rec.key === key);
    }

    getKey(idx) {
        if (idx >= 0 && idx < this.state.records.length) {
            return this.state.records[idx].key;
        }
        return "";
    }

    changeSrc(e) {
        e.preventDefault();
        const src = e.target.elements.source.value;
        if (src.includes("www.youtube.com")) {
            this.player.src({type: "video/youtube", src: src});
        }
        else {
            this.player.src({src: src});
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
        rec.text = e.target.value;
        this.setState({records: this.state.records});
    }

    deleteRecord(key = this.state.rec_key) {
        if (key !== "") {
            const markers = this.player.markers.getMarkers();
            const idx = markers.findIndex(m => m.key === key);
            this.player.markers.remove([idx]);
            const newKey = this.getKey(Math.min(idx, markers.length - 1));
            this.setState({rec_key: newKey, records: markers});
        }
    }

    playRecord(key) {
        this.videoNode.scrollIntoView();
        if (key !== "") {
            const rec = this.state.records[this.getIdx(key)];
            this.player.play(this.player.currentTime(rec.time));
            let getToPlay = () => {
                if (this.player.currentTime() >= rec.time + rec.duration) {
                    this.player.pause();
                    this.player.off("timeupdate", getToPlay);
                }
            };
            this.player.on("timeupdate", getToPlay);
        }
        this.setState({rec_key: key});
    }

    addRecord() {
        const markers = this.player.markers.getMarkers();
        const time = this.player.currentTime();
        this.player.markers.add([{
            time: time,
            duration: 0,
            text: "",
        }]);
        const key = markers.find(m => m.time === time && m.duration === 0).key;
        this.setState({rec_key: key, records: markers});
    }

    updateRecord(n, key = this.state.rec_key) {
        if (key !== "") {
            const time = this.player.currentTime();
            let rec = this.state.records[this.getIdx(key)];
            if (n === 1) {
                let end = rec.time + rec.duration;
                rec.time = time;
                end = Math.max(time, end);
                rec.duration = end - rec.time;
            }
            else {
                rec.duration = time - rec.time;
            }
            this.player.markers.updateTime();
            this.setState({records: this.state.records});
        }
    }

    offline(e) {
        e.preventDefault();
        let flag = this.state.description;
        this.state.records.map(rec => flag = flag && rec.text);
        if (flag) {
            const onlineCopy = JSON.parse(JSON.stringify(this.state.records));
            this.setState({onlineCopy: onlineCopy, status: Status.OFFLINE});
            this.playRecord(this.getKey(0));
            this.player.controlBar.progressControl.enable();
        }
        else {
            alert("Please fill in all descriptions.");
        }
    }

    prev() {
        const idx = this.getIdx();
        if (idx - 1 >= 0) {
            this.playRecord(this.getKey(idx - 1));
        }
    }

    next() {
        const idx = this.getIdx();
        if (idx + 1 < this.state.records.length) {
            this.playRecord(this.getKey(idx + 1));
        }
    }

    // fast forward or rewind the video
    jump(offset = this.state.timeOffset) {
        this.player.currentTime(this.player.currentTime() + offset);
    }

    save() {
        const data = {
            src: this.player.currentSrc(),
            desc: this.state.description,
            online: this.state.onlineCopy,
            offline: this.state.records,
        };
        axios.post('/save', data).then().then();
    }

    renderOfflineTable() {
        return <table className="table table-sm table-striped table-bordered text-center">
            <thead>
            <tr>
                <th style={{width: "5%"}}></th>
                <th style={{width: "10%"}}>Start</th>
                <th style={{width: "10%"}}>End</th>
                <th style={{width: "40%"}}>Description</th>
            </tr>
            </thead>
            <tbody>
            {this.state.records.map(rec => {
                return (
                    <tr key={rec.key}>
                        <td>
                            <button
                                className={"btn btn btn-outline-danger"
                                + (this.state.rec_key === rec.key ? " active" : "")}
                                onClick={() => this.playRecord(rec.key)}></button>
                        </td>
                        <td style={{width: "10%"}}>{videojs.formatTime(rec.time)}</td>
                        <td style={{width: "10%"}}>{videojs.formatTime(rec.time + rec.duration)}</td>
                        <td style={{width: "40%"}} className="text-justify"><ContentEditable
                            html={rec.text}
                            onChange={e => this.changeRecordDescription(e, rec)}/>
                        </td>
                    </tr>)
            })}
            </tbody>
        </table>;
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
                return <div className="w-100">
                    <div className="form-group mb-4 d-flex justify-content-around">
                        <button className="btn btn-danger"
                                onClick={this.prev}>Prev
                        </button>
                        <button className="btn btn-danger"
                                onClick={this.next}>Next
                        </button>
                        {this.state.records.filter(rec => rec.key === this.state.rec_key).map(rec => {
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
                </div>;
            case Status.OFFLINE:
                return <div className="d-flex justify-content-around">
                    <div className="btn-group">
                        <button className="btn btn-outline-danger"
                                onClick={() => this.jump(-this.state.timeOffset - 0.4)}>{"<"}
                        </button>
                        <input className="w-25 text-center"
                               type="number"
                               value={this.state.timeOffset}
                               onChange={e => this.setState({timeOffset: Math.max(e.target.value, 0)})}/>
                        <button className="btn btn-outline-danger"
                                onClick={() => this.jump()}>{">"}
                        </button>
                    </div>
                    <button className="btn btn-outline-danger mr-3"
                            onClick={() => this.updateRecord(1)}>Set Start
                    </button>
                    <button className="btn btn-outline-danger mr-3"
                            onClick={() => this.updateRecord(2)}>Set End
                    </button>
                    <button className="btn btn-danger mr-3"
                            onClick={() => this.deleteRecord()}>Delete
                    </button>
                    <button className="btn btn-success mr-3"
                            onClick={this.addRecord}>Add
                    </button>
                    <button className="btn btn-info"
                            onClick={() => this.save()}>SAVE
                    </button>
                </div>;
            default:
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

                <div id="records_list" className="col-md-2">
                    <table className="table table-sm table-striped table-bordered text-center">
                        <thead className="rec-h">
                        <tr className="rec-r">
                            <th className="rec-h">Records</th>
                        </tr>
                        </thead>
                        <tbody className="rec-b">
                        {this.state.records.map(rec => {
                            return (
                                <tr className="rec-r" key={rec.key}>
                                    <td className="rec-d">
                                        <button
                                            className={"btn btn-sm" + (rec.text ? " btn-success" : " btn-outline-success")
                                            + (this.state.rec_key === rec.key ? " active" : "")}
                                            disabled={this.state.status === Status.VIEW}
                                            onClick={() => this.playRecord(rec.key)}>{videojs.formatTime(rec.time)}</button>
                                    </td>
                                </tr>)
                        })}
                        </tbody>
                    </table>
                </div>

                <div className="col-md-10 my-4 d-flex justify-content-around">
                    {this.renderToolBar()}
                </div>
                {this.state.status === Status.OFFLINE && this.renderOfflineTable()}
            </div>
        )
    }
}