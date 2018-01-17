import React from 'react';
import videojs from 'video.js';
import videojsYoutube from 'videojs-youtube';
import videojsMarker from 'videojs-markers';
import './videojs.markers.css';

export default class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            like: false,
            likes: [],
        };
        this.handleSourceChange = this.handleSourceChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
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
                text: "Like " + (markers.length + 1),
            }]);
        }
        else {
            markers[markers.length - 1].duration = this.player.currentTime() -
                markers[markers.length - 1].time;
            this.player.markers.updateTime();
            this.setState({likes: markers})
        }
        this.setState(prevState => ({like: !prevState.like}));
        console.log(this.state.likes);
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
                <div className="col-md-10">
                    <h4>Description</h4>
                    <div className="mb-4" contentEditable><textarea className="form-control" rows="3" placeholder="This is about ..."></textarea></div>
                    <h4>Likes</h4>
                    <table className="table table-striped table-bordered">
                        <thead>
                        <tr>
                            <th scope="col">From (Second)</th>
                            <th scope="col">To (Second)</th>
                            <th scope="col">Description</th>
                        </tr>
                        </thead>
                        <tbody>{this.state.likes.map(like => {
                            return (<tr key={like.key}>
                                <td>{like.time.toFixed(2)}</td>
                                <td>{(like.time + like.duration).toFixed(2)}</td>
                                <td><div contentEditable onInput={() => 1}>{like.text}</div></td>
                            </tr>)
                        })}</tbody>
                    </table>
                </div>
            </div>
        )
    }
}