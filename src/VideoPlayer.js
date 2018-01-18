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
        this.handleSourceChange = this.handleSourceChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleLikeDescriptionChange = this.handleLikeDescriptionChange.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
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

    handleSourceChange(event) {
        event.preventDefault();
        let url = event.target.elements.source.value;
        if (url.includes("www.youtube.com")) {
            this.player.src({type: 'video/youtube', src: url});
        }
        else {
            this.player.src({src: url});
        }
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

    handleDescriptionChange(event) {
        event.preventDefault();
        this.setState({description: event.target.value});
    }

    handleLikeDescriptionChange(event, like) {
        let markers = this.player.markers.getMarkers();
        markers.map(m => {
            if (m.key === like.key) {
                m.text = event.target.value;
            }
        });
        this.setState({likes: markers});
    }

    handleRemove(like) {
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

    render() {
        return (
            <div className="row justify-content-center">
                <form className="form-inline col-md-12 my-4 d-flex justify-content-center"
                      onSubmit={this.handleSourceChange}>
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
                              onChange={this.handleDescriptionChange}></textarea>
                </div>
                <div className="col-md-10">
                    <h4>Likes</h4>
                    <table className="table table-striped table-bordered">
                        <thead>
                        <tr>
                            <th scope="col">From (Second)</th>
                            <th scope="col">To (Second)</th>
                            <th scope="col">Description</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.likes.map(like => {
                            return (
                                <tr key={like.key}>
                                    <td>{like.time.toFixed(2)}</td>
                                    <td>{(like.time + like.duration).toFixed(2)}</td>
                                    <td><ContentEditable html={like.text}
                                                         onChange={e => this.handleLikeDescriptionChange(e, like)}/>
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-danger"
                                                onClick={e => this.handleRemove(like)}>Remove
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