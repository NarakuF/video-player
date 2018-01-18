import React from 'react';
import videojs from 'video.js';
// eslint-disable-next-line
import videojsYoutube from 'videojs-youtube';
// eslint-disable-next-line
import videojsMarker from 'videojs-markers';
import ContentEditable from 'react-contenteditable'
import './videojs.markers.css';

export default class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            like: false,
            likes: [],
            description: "",
        };
        this.handleChangeSource = this.handleChangeSource.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleChangeDescription = this.handleChangeDescription.bind(this);
        this.handleChangeLikeDescription = this.handleChangeLikeDescription.bind(this);
        this.handleDeleteLike = this.handleDeleteLike.bind(this);
        this.handlePlayLike = this.handlePlayLike.bind(this);
    }

    componentDidMount() {
        // instantiate Video.js
        this.player = videojs(this.videoNode, this.props);
        this.player.markers({markers: []});
    }

    // destroy player on unmount
    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
    }

    handleChangeSource(event) {
        event.preventDefault();
        let url = event.target.elements.source.value;
        if (url.includes("www.youtube.com")) {
            this.player.src({type: 'video/youtube', src: url});
        }
        else {
            this.player.src({src: url});
        }
        this.player.markers.reset([]);
        this.setState({ like: false, likes: [], description: ""});
    }

    handleClick() {
        let markers = this.player.markers.getMarkers();
        if (!this.state.like) {
            this.player.markers.add([{
                time: this.player.currentTime(),
                text: `Like: ${this.player.currentTime().toFixed(2)}s`,
            }]);
        }
        else {
            markers[markers.length - 1].duration = this.player.currentTime() -
                markers[markers.length - 1].time;
            this.player.markers.updateTime();
        }
        this.setState(prevState => ({like: !prevState.like, likes: markers}));
        console.log(markers)
    }

    handleChangeDescription(event) {
        event.preventDefault();
        this.setState({description: event.target.value});
    }

    handleChangeLikeDescription(event, like) {
        let markers = this.player.markers.getMarkers();
        markers.map(m => {
            if (m.key === like.key) {
                m.text = event.target.value;
            }
        });
        this.setState({likes: markers});
    }

    handleDeleteLike(like) {
        let markers = this.player.markers.getMarkers();
        let i;
        for (i = 0; i < markers.length; i++) {
            if (markers[i].key === like.key) {
                this.player.markers.remove([i]);
                break;
            }
        }
        this.setState({likes: markers});
        console.log(markers)
    }

    handlePlayLike(like) {
        this.player.currentTime(like.time);
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
                    <button className="btn btn-outline-danger" onClick={this.handleClick}>
                        {this.state.like ? 'Unlike' : 'Like'}
                    </button>
                </div>
                <div className="col-md-10 my-4">
                    <h4>Description</h4>
                    <textarea className="form-control" rows="3"
                              placeholder={"This is about ..." + this.state.description}
                              onChange={this.handleChangeDescription}></textarea>
                </div>
                <div className="col-md-10">
                    <h4>Likes</h4>
                    <table className="table table-striped table-bordered text-center">
                        <thead>
                        <tr>
                            <th style={{width: '5%'}}></th>
                            <th style={{width: '10%'}}>From (Second)</th>
                            <th style={{width: '10%'}}>To (Second)</th>
                            <th style={{width: '40%'}}>Description</th>
                            <th style={{width: '5%'}}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.likes.map(like => {
                            return (
                                <tr key={like.key}>
                                    <td><button className="btn btn-sm btn-primary"
                                                onClick={e => this.handlePlayLike(like)}></button></td>
                                    <td>{like.time.toFixed(2)}</td>
                                    <td>{(like.time + like.duration).toFixed(2)}</td>
                                    <td><ContentEditable html={like.text}
                                                         onChange={e => this.handleChangeLikeDescription(e, like)}/>
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-danger"
                                                onClick={e => this.handleDeleteLike(like)}>Delete
                                        </button>
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