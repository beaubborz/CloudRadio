#include <vlc/vlc.h>
#include <vector>

class Radio
{
public:
	Radio();
	~Radio();

	void setSong(std::string path);
	void setSongEndedCallback(libvlc_callback_t callback);
	void setProgressCallback(libvlc_callback_t callback);
	void play();
	void pause();
	void stop();

private:
    libvlc_instance_t* _inst;
	libvlc_media_player_t* _mp;
	std::string _path;
	bool _isPaused;
};