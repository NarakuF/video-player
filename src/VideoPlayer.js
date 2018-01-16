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
        }
        this.handleSourceChange = this.handleSourceChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    componentDidMount() {
        // instantiate Video.js
        this.player = videojs(this.videoNode, this.props);
        this.player.markers({ markers: []});
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
            this.player.src({ type: 'video/youtube', src: url });
        }
        else {
            this.player.src({ src: url  });
        }
    }

    handleClick() {
        if (!this.state.like) {
            this.setState(prevState => ({ likes: [...prevState.likes, {from: this.player.currentTime()}] }));
            this.player.markers.add([{
                time: this.player.currentTime(),
                text: "I'm added dynamically"
            }]);
            console.log(this.player.markers);
        }
        else {
            let copy = this.state.likes.slice();
            copy[copy.length - 1].to = this.player.currentTime();
            this.setState({ likes: copy });
        }
        this.setState(prevState => ({ like: !prevState.like }));
        console.log(this.state.likes);
    }

    render() {
        return (
            <div className="row">
                <form className="form-inline col-md-12 my-4" onSubmit={this.handleSourceChange}>
                    <input className="form-control w-75 mr-auto" type="text" name="source"/>
                    <button className="btn btn-outline-primary" type="submit">View</button>
                </form>
                <div data-vjs-player className="col-md-12">
                    <video ref={node => this.videoNode = node} className="video-js"></video>
                </div>
                <div className="mx-auto my-4">
                    <button className="btn btn-outline-danger mr-5" onClick={this.handleClick}>
                        { this.state.like ? 'Unike' : 'Like' }
                    </button>
                </div>
                <div className="col-md-12">
                    <h4>Description</h4>
                </div>
            </div>
        )
    }
}