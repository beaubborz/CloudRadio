#include <iostream>
#include <string>
#include <vlc/vlc.h>
#include "Radio.h"

int lastProgress = 0;
void generateSongEndedEvent(const struct libvlc_event_t *, void *)
{
	//writes $ to the output. Tells NODEJS that playback finished.
	std::cout<<"$"<<std::endl;
	std::cout<<"Playback ended!! You should set another song to play!! :)"<<std::endl;
	lastProgress = 0;
}

void generateProgressChangedEvent(const struct libvlc_event_t * e, void *)
{
	int progress=(int)(libvlc_media_player_get_position((libvlc_media_player_t*)e->p_obj)*100);
	if(lastProgress != progress)
	{
		std::cout<<"%"<<progress<<'%'<<std::endl;
		lastProgress = progress;
	}
}

int main( int argc, const char* argv[] )
{
	typedef enum{
		INIT, SET_SONG, PLAY, PAUSE, STOP
	} ETAT;

	//system is running.
	std::cout<<"Allo"<<std::endl;

	std::string message;
	Radio radio;
	radio.setSongEndedCallback(generateSongEndedEvent);
	radio.setProgressCallback(generateProgressChangedEvent);
	bool run = true;

	ETAT e = INIT;

	while(run)
	{
		std::getline(std::cin,message);
		switch(e)
		{
		case INIT:
			if(message == "SET_SONG")
			{
				e = SET_SONG;
			}
			else if(message == "PLAY")
			{
				radio.play();
			}
			else if(message == "PAUSE")
			{
				radio.pause();
			}
			else if(message == "STOP")
			{
				radio.stop();
			}
			else if(message == "KILL")
			{
				run=false;
			}
			else
			{
				std::cerr<<"Unknown command: "<<message<<std::endl;
			}

		break;

		case SET_SONG:
			radio.setSong(message);
			e = INIT;
		break;

		default:
			std::cerr<<"State-machine entered an unknown state! returning to init..."<<std::endl;
			e = INIT;
		}
	}

	std::cout<<"STOPPING RADIO..."<<std::endl;
	return 0;
}